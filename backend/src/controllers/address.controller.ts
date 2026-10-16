import { Response, NextFunction } from 'express';
import { Address } from '../models/Address';
import { AuthenticatedRequest } from '../types';

export const addressController = {
  // GET /api/addresses
  async getAddresses(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const addresses = await Address.find({ userId: req.user!._id.toString() })
        .sort({ isDefault: -1, createdAt: -1 })
        .lean();
      res.json({ success: true, data: addresses });
    } catch (error) {
      next(error);
    }
  },

  // POST /api/addresses
  async createAddress(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const { isDefault, ...rest } = req.body as { isDefault?: boolean; [key: string]: unknown };

      if (isDefault) {
        // Unset any existing default
        await Address.updateMany({ userId }, { isDefault: false });
      }

      const count = await Address.countDocuments({ userId });
      const address = await Address.create({
        ...rest,
        userId,
        isDefault: isDefault || count === 0, // First address is auto-default
      });

      res.status(201).json({
        success: true,
        data: address,
        message: 'Address added successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // PUT /api/addresses/:id
  async updateAddress(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const address = await Address.findOne({ _id: req.params.id, userId });

      if (!address) {
        res.status(404).json({ success: false, message: 'Address not found' });
        return;
      }

      const { isDefault, ...rest } = req.body as { isDefault?: boolean; [key: string]: unknown };

      if (isDefault) {
        await Address.updateMany({ userId }, { isDefault: false });
      }

      Object.assign(address, { ...rest, isDefault: isDefault ?? address.isDefault });
      await address.save();

      res.json({ success: true, data: address, message: 'Address updated' });
    } catch (error) {
      next(error);
    }
  },

  // DELETE /api/addresses/:id
  async deleteAddress(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      const address = await Address.findOneAndDelete({ _id: req.params.id, userId });

      if (!address) {
        res.status(404).json({ success: false, message: 'Address not found' });
        return;
      }

      // If deleted was default, make next address default
      if (address.isDefault) {
        const next = await Address.findOne({ userId }).sort({ createdAt: -1 });
        if (next) {
          next.isDefault = true;
          await next.save();
        }
      }

      res.json({ success: true, message: 'Address deleted' });
    } catch (error) {
      next(error);
    }
  },

  // PATCH /api/addresses/:id/default
  async setDefault(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!._id.toString();
      await Address.updateMany({ userId }, { isDefault: false });
      const address = await Address.findOneAndUpdate(
        { _id: req.params.id, userId },
        { isDefault: true },
        { returnDocument: 'after' }
      );
      if (!address) {
        res.status(404).json({ success: false, message: 'Address not found' });
        return;
      }
      res.json({ success: true, data: address, message: 'Default address updated' });
    } catch (error) {
      next(error);
    }
  },
};
