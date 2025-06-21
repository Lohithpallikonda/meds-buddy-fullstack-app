const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const Medication = require('../models/Medication')
const MedicationLog = require('../models/MedicationLog')
const { runQuery } = require('../models/database')
const { authenticateToken } = require('../middleware/auth')
const {
  validateMedicationData,
  sanitizeMedicationData,
  validateLogData,
  formatMedicationResponse,
  formatLogResponse,
  getTodayDate
} = require('../utils/medicationValidation')

const router = express.Router()

const uploadDir = path.join(__dirname, '../../uploads/medication_proofs')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed!'), false)
  }
}

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
})

router.use(authenticateToken)

router.get('/today', async (req, res) => {
  try {
    const todaysMedications = await Medication.getTodaysMedications(req.user.id)
    const formattedMedications = todaysMedications.map(formatMedicationResponse)
    res.json({
      message: 'Today\'s medications retrieved successfully',
      medications: formattedMedications,
      date: getTodayDate(),
      count: formattedMedications.length
    })
  } catch (error) {
    console.error('Get today\'s medications error:', error)
    res.status(500).json({
      message: 'Failed to retrieve today\'s medications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

router.get('/stats', async (req, res) => {
  try {
    const stats = await Medication.getMedicationStats(req.user.id)
    const adherence = await MedicationLog.calculateAdherence(req.user.id)
    const streak = await MedicationLog.getMedicationStreak(req.user.id)
    const recentActivity = await MedicationLog.getRecentActivity(req.user.id, 5)
    res.json({
      message: 'Medication statistics retrieved successfully',
      stats: {
        ...stats,
        adherence_rate: adherence.adherence_rate,
        medication_streak: streak,
        adherence_details: adherence
      },
      recent_activity: recentActivity.map(formatLogResponse)
    })
  } catch (error) {
    console.error('Get medication stats error:', error)
    res.status(500).json({
      message: 'Failed to retrieve medication statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

router.get('/logs/history', async (req, res) => {
  try {
    const { start_date, end_date, limit = 50 } = req.query
    let logs
    if (start_date && end_date) {
      logs = await MedicationLog.getUserLogs(req.user.id, start_date, end_date)
    } else {
      logs = await MedicationLog.getRecentActivity(req.user.id, parseInt(limit))
    }
    res.json({
      message: 'Medication logs retrieved successfully',
      logs: logs.map(formatLogResponse),
      count: logs.length
    })
  } catch (error) {
    console.error('Get medication logs error:', error)
    res.status(500).json({
      message: 'Failed to retrieve medication logs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

router.get('/', async (req, res) => {
  try {
    const medications = await Medication.findByUserId(req.user.id)
    const formattedMedications = medications.map(formatMedicationResponse)
    res.json({
      message: 'Medications retrieved successfully',
      medications: formattedMedications,
      count: formattedMedications.length
    })
  } catch (error) {
    console.error('Get medications error:', error)
    res.status(500).json({
      message: 'Failed to retrieve medications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

router.post('/', async (req, res) => {
  try {
    const medicationData = sanitizeMedicationData(req.body)
    const validation = validateMedicationData(medicationData)
    if (!validation.isValid) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validation.errors
      })
    }
    const newMedication = await Medication.create({
      user_id: req.user.id,
      ...medicationData
    })
    res.status(201).json({
      message: 'Medication created successfully',
      medication: formatMedicationResponse(newMedication)
    })
  } catch (error) {
    console.error('Create medication error:', error)
    res.status(500).json({
      message: 'Failed to create medication',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const medicationId = parseInt(req.params.id)
    if (isNaN(medicationId)) {
      return res.status(400).json({
        message: 'Invalid medication ID'
      })
    }
    const belongsToUser = await Medication.belongsToUser(medicationId, req.user.id)
    if (!belongsToUser) {
      return res.status(404).json({
        message: 'Medication not found'
      })
    }
    const medication = await Medication.findById(medicationId)
    res.json({
      message: 'Medication retrieved successfully',
      medication: formatMedicationResponse(medication)
    })
  } catch (error) {
    console.error('Get medication error:', error)
    res.status(500).json({
      message: 'Failed to retrieve medication',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const medicationId = parseInt(req.params.id)
    if (isNaN(medicationId)) {
      return res.status(400).json({
        message: 'Invalid medication ID'
      })
    }
    const belongsToUser = await Medication.belongsToUser(medicationId, req.user.id)
    if (!belongsToUser) {
      return res.status(404).json({
        message: 'Medication not found'
      })
    }
    const updateData = sanitizeMedicationData(req.body)
    const validation = validateMedicationData(updateData)
    if (!validation.isValid) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: validation.errors
      })
    }
    const updatedMedication = await Medication.update(medicationId, updateData)
    res.json({
      message: 'Medication updated successfully',
      medication: formatMedicationResponse(updatedMedication)
    })
  } catch (error) {
    console.error('Update medication error:', error)
    res.status(500).json({
      message: 'Failed to update medication',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const medicationId = parseInt(req.params.id)
    if (isNaN(medicationId)) {
      return res.status(400).json({
        message: 'Invalid medication ID'
      })
    }
    const belongsToUser = await Medication.belongsToUser(medicationId, req.user.id)
    if (!belongsToUser) {
      return res.status(404).json({
        message: 'Medication not found'
      })
    }
    const deleted = await Medication.delete(medicationId)
    if (!deleted) {
      return res.status(404).json({
        message: 'Medication not found'
      })
    }
    res.json({
      message: 'Medication deleted successfully'
    })
  } catch (error) {
    console.error('Delete medication error:', error)
    res.status(500).json({
      message: 'Failed to delete medication',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

router.post('/:id/take', async (req, res) => {
  try {
    const medicationId = parseInt(req.params.id)
    const { notes } = req.body
    if (isNaN(medicationId)) {
      return res.status(400).json({
        message: 'Invalid medication ID'
      })
    }
    const logValidation = validateLogData({
      medication_id: medicationId,
      status: 'taken',
      notes: notes
    })
    if (!logValidation.isValid) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: logValidation.errors
      })
    }
    const belongsToUser = await Medication.belongsToUser(medicationId, req.user.id)
    if (!belongsToUser) {
      return res.status(404).json({
        message: 'Medication not found'
      })
    }
    const log = await MedicationLog.markAsTaken(medicationId, notes)
    res.json({
      message: 'Medication marked as taken',
      log: formatLogResponse(log)
    })
  } catch (error) {
    console.error('Mark medication taken error:', error)
    res.status(500).json({
      message: 'Failed to mark medication as taken',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

router.post('/:id/miss', async (req, res) => {
  try {
    const medicationId = parseInt(req.params.id)
    const { notes } = req.body
    if (isNaN(medicationId)) {
      return res.status(400).json({
        message: 'Invalid medication ID'
      })
    }
    const logValidation = validateLogData({
      medication_id: medicationId,
      status: 'missed',
      notes: notes
    })
    if (!logValidation.isValid) {
      return res.status(400).json({
        message: 'Validation failed',
        errors: logValidation.errors
      })
    }
    const belongsToUser = await Medication.belongsToUser(medicationId, req.user.id)
    if (!belongsToUser) {
      return res.status(404).json({
        message: 'Medication not found'
      })
    }
    const log = await MedicationLog.markAsMissed(medicationId, notes)
    res.json({
      message: 'Medication marked as missed',
      log: formatLogResponse(log)
    })
  } catch (error) {
    console.error('Mark medication missed error:', error)
    res.status(500).json({
      message: 'Failed to mark medication as missed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

router.post('/:id/undo', async (req, res) => {
  try {
    const medicationId = parseInt(req.params.id)
    if (isNaN(medicationId)) {
      return res.status(400).json({
        message: 'Invalid medication ID'
      })
    }
    const belongsToUser = await Medication.belongsToUser(medicationId, req.user.id)
    if (!belongsToUser) {
      return res.status(404).json({
        message: 'Medication not found'
      })
    }
    const today = getTodayDate()
    const existingLog = await MedicationLog.findByMedicationAndDate(medicationId, today)
    if (!existingLog) {
      return res.status(404).json({
        message: 'No log found for today'
      })
    }
    const deleted = await MedicationLog.delete(existingLog.id)
    if (!deleted) {
      return res.status(500).json({
        message: 'Failed to undo medication log'
      })
    }
    res.json({
      message: 'Medication log undone successfully'
    })
  } catch (error) {
    console.error('Undo medication log error:', error)
    res.status(500).json({
      message: 'Failed to undo medication log',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

router.post('/:logId/upload-proof', upload.single('proofImage'), async (req, res) => {
  try {
    const logId = parseInt(req.params.logId)
    const userId = req.user.id
    if (isNaN(logId)) {
      return res.status(400).json({ message: 'Invalid log ID' })
    }
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' })
    }
    const log = await MedicationLog.findById(logId)
    const medication = log ? await Medication.findById(log.medication_id) : null
    if (!medication || medication.user_id !== userId) {
      fs.unlinkSync(req.file.path)
      return res.status(404).json({ message: 'Log not found or access denied' })
    }
    const imagePath = `/uploads/medication_proofs/${req.file.filename}`
    const sql = `UPDATE medication_logs SET proof_image_path = ? WHERE id = ?`
    await runQuery(sql, [imagePath, logId])
    const updatedLog = await MedicationLog.findById(logId)
    res.json({
      message: 'Proof uploaded successfully',
      log: formatLogResponse(updatedLog),
    })
  } catch (error) {
    console.error('Upload proof error:', error)
    res.status(500).json({
      message: 'Failed to upload proof',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    })
  }
})

module.exports = router