import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Lazy initialize Supabase admin client
  let supabaseAdmin: ReturnType<typeof createClient> | null = null;
  const getSupabaseAdmin = () => {
    if (!supabaseAdmin) {
      const supabaseUrl = process.env.VITE_SUPABASE_URL;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for this action');
      }
      supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
    }
    return supabaseAdmin;
  };

  // Middleware to verify admin session
  const verifyAdmin = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
      }

      const adminClient = getSupabaseAdmin();
      const { data: { user }, error: authError } = await adminClient.auth.getUser(token);
      if (authError || !user) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }

      const { data: profile, error: profileError } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'owner')) {
        res.status(403).json({ error: 'Require admin privileges' });
        return;
      }

      next();
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  };

  // API Routes
  app.post('/api/create-user', verifyAdmin, async (req: express.Request, res: express.Response) => {
    try {
      const { email, password, full_name, role } = req.body;
      
      if (!email || !password || !full_name || !role) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      const adminClient = getSupabaseAdmin();
      // Create user via admin API
      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role }
      });

      if (authError) {
        console.error("Auth creation error:", authError);
        res.status(400).json({ error: authError.message });
        return;
      }

      if (!authData.user) {
        res.status(500).json({ error: 'User creation failed' });
        return;
      }

      res.json({ success: true, user: authData.user });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.patch('/api/update-user', verifyAdmin, async (req: express.Request, res: express.Response) => {
    try {
      const { id, role, is_active } = req.body;
      if (!id) {
        res.status(400).json({ error: 'Missing user id' });
        return;
      }

      const updates: any = {};
      if (role !== undefined) updates.role = role;
      if (is_active !== undefined) updates.is_active = is_active;

      const adminClient = getSupabaseAdmin();
      const { error } = await adminClient
        .from('profiles')
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error("Profile update error:", error);
        res.status(400).json({ error: error.message });
        return;
      }

      if (is_active !== undefined) {
        await adminClient.auth.admin.updateUserById(id, {
          ban_duration: is_active === false ? '876000h' : 'none'
        });
      }

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server", err);
});
