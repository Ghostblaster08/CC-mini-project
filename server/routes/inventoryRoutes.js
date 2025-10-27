import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Inventory from '../models/Inventory.js';

const router = express.Router();

// All routes are protected and require pharmacy role
router.use(protect);
router.use(authorize('pharmacy', 'admin'));

// @route   GET /api/inventory
// @desc    Get all inventory items for pharmacy
// @access  Private (Pharmacy)
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    let query = { pharmacy: req.user._id };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { medicationName: { $regex: search, $options: 'i' } },
        { genericName: { $regex: search, $options: 'i' } }
      ];
    }

    const inventory = await Inventory.find(query).sort({ medicationName: 1 });

    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/inventory
// @desc    Add new inventory item
// @access  Private (Pharmacy)
router.post('/', async (req, res) => {
  try {
    const inventoryData = {
      ...req.body,
      pharmacy: req.user._id
    };

    const inventory = await Inventory.create(inventoryData);

    res.status(201).json({
      success: true,
      message: 'Inventory item added successfully',
      data: inventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/inventory/:id
// @desc    Get single inventory item
// @access  Private (Pharmacy)
router.get('/:id', async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Check ownership
    if (inventory.pharmacy.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this inventory item'
      });
    }

    res.status(200).json({
      success: true,
      data: inventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   PUT /api/inventory/:id
// @desc    Update inventory item
// @access  Private (Pharmacy)
router.put('/:id', async (req, res) => {
  try {
    let inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Check ownership
    if (inventory.pharmacy.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this inventory item'
      });
    }

    inventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Inventory item updated successfully',
      data: inventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   DELETE /api/inventory/:id
// @desc    Delete inventory item
// @access  Private (Pharmacy)
router.delete('/:id', async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Check ownership
    if (inventory.pharmacy.toString() !== req.user._id.toString() && 
        req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this inventory item'
      });
    }

    await inventory.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   POST /api/inventory/:id/restock
// @desc    Restock inventory item
// @access  Private (Pharmacy)
router.post('/:id/restock', async (req, res) => {
  try {
    const { quantity, supplier, cost } = req.body;

    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Check ownership
    if (inventory.pharmacy.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to restock this item'
      });
    }

    // Update quantity
    inventory.quantity += quantity;

    // Add to restock history
    inventory.restockHistory.push({
      quantity,
      supplier,
      cost
    });

    await inventory.save();

    res.status(200).json({
      success: true,
      message: 'Inventory restocked successfully',
      data: inventory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @route   GET /api/inventory/low-stock
// @desc    Get low stock items
// @access  Private (Pharmacy)
router.get('/alerts/low-stock', async (req, res) => {
  try {
    const inventory = await Inventory.find({ pharmacy: req.user._id });
    const lowStockItems = inventory.filter(item => item.needsReorder());

    res.status(200).json({
      success: true,
      count: lowStockItems.length,
      data: lowStockItems
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
