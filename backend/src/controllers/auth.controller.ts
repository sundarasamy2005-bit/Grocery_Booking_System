import { Request, Response, NextFunction } from 'express';
import { getAuth } from '../config/firebase';
import { User } from '../models/User';
import { Shop } from '../models/Shop';
import { AuthenticatedRequest } from '../types';
import { emailService } from '../services/email.service';

export const authController = {
  // POST /api/auth/sync
  // Called after Firebase login/registration to sync user with MongoDB
  async syncUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ success: false, message: 'No token provided' });
        return;
      }

      const token = authHeader.split(' ')[1];
      const decoded = await getAuth().verifyIdToken(token);

      const { uid, email, name: displayName, picture } = decoded;

      if (!email) {
        res.status(400).json({ success: false, message: 'Email is required' });
        return;
      }

      const adminEmails = [
        'pavithrapavii6048@gmail.com',
        'pavithrapavi6048@gmail.com',
        (process.env.ADMIN_EMAIL || '').toLowerCase(),
      ].filter(Boolean).map((e) => e.toLowerCase());

      const isAdmin = adminEmails.includes(email.toLowerCase());

      let user = await User.findOne({
        $or: [{ firebaseUid: uid }, { email: email.toLowerCase() }],
      });
      const isNewUser = !user;

      const body = (req.body || {}) as { role?: string; name?: string };

      if (!user) {
        // Create new user — designated admin gets 'admin' role; others get shopOwner or customer
        const role = body.role;
        const safeRole = isAdmin ? 'admin' : (role === 'shopOwner' ? 'shopOwner' : 'customer');

        user = await User.create({
          firebaseUid: uid,
          name: body.name || displayName || email.split('@')[0],
          email: email.toLowerCase(),
          profileImage: picture,
          role: safeRole,
          isActive: true,
        });

        // If registered as shopOwner, immediately create their initial active & approved shop profile
        if (safeRole === 'shopOwner') {
          await Shop.create({
            ownerId: user._id.toString(),
            shopName: `${user.name}'s Grocery Shop`,
            description: `Fresh quality groceries and essentials by ${user.name}`,
            phone: user.phone || '9876543210',
            email: user.email,
            address: 'Main Bazaar',
            city: 'Pollachi',
            state: 'Tamil Nadu',
            postalCode: '642001',
            latitude: 10.6585,
            longitude: 77.0094,
            isApproved: true,
            isActive: true,
            deliveryAvailable: true,
            pickupAvailable: true,
            minimumOrderAmount: 0,
          });
          console.log(`🏪 Auto-created initial shop profile for shop owner: ${user.email}`);
        }

        // Send welcome email asynchronously
        emailService
          .sendRegistrationEmail(email, user.name)
          .catch((err) => console.error('Welcome email failed:', err));
      } else {
        // Update existing user info from Firebase or registration sync
        let modified = false;

        if (user.firebaseUid !== uid) {
          user.firebaseUid = uid;
          modified = true;
        }

        if (isAdmin && user.role !== 'admin') {
          user.role = 'admin';
          user.isActive = true;
          modified = true;
        } else if (!isAdmin && body.role && ['customer', 'shopOwner'].includes(body.role)) {
          // Allow setting/updating role if requested during registration sync
          if (user.role !== body.role) {
            user.role = body.role as 'customer' | 'shopOwner';
            modified = true;
          }
        }

        if (body.name && body.name.trim() && user.name !== body.name.trim()) {
          user.name = body.name.trim();
          modified = true;
        }

        if (picture && !user.profileImage) {
          user.profileImage = picture;
          modified = true;
        }

        if (modified) {
          await user.save();
        }

        // Ensure shopOwner always has an active & approved shop profile
        if (user.role === 'shopOwner') {
          const existingShop = await Shop.findOne({ ownerId: user._id.toString() });
          if (!existingShop) {
            await Shop.create({
              ownerId: user._id.toString(),
              shopName: `${user.name}'s Grocery Shop`,
              description: `Fresh quality groceries and essentials by ${user.name}`,
              phone: user.phone || '9876543210',
              email: user.email,
              address: 'Main Bazaar',
              city: 'Pollachi',
              state: 'Tamil Nadu',
              postalCode: '642001',
              latitude: 10.6585,
              longitude: 77.0094,
              isApproved: true,
              isActive: true,
              deliveryAvailable: true,
              pickupAvailable: true,
              minimumOrderAmount: 0,
            });
            console.log(`🏪 Auto-created missing shop profile for existing shop owner: ${user.email}`);
          }
        }
      }

      if (!user.isActive) {
        res.status(403).json({ success: false, message: 'Account is suspended' });
        return;
      }

      res.status(isNewUser ? 201 : 200).json({
        success: true,
        data: {
          id: user._id,
          firebaseUid: user.firebaseUid,
          name: user.name,
          email: user.email,
          phone: user.phone,
          profileImage: user.profileImage,
          role: user.role,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
        isNewUser,
      });
    } catch (error) {
      next(error);
    }
  },

  // GET /api/auth/me
  async getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
    const user = req.user!;
    res.json({
      success: true,
      data: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profileImage: user.profileImage,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
      },
    });
  },
};
