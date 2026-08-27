import mongoose from 'mongoose';

const distributionPointSchema = new mongoose.Schema({
  name: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  address: { type: String, default: '' },
  equipmentType: { type: String, default: '' }
}, { timestamps: true });

distributionPointSchema.index({ latitude: 1, longitude: 1 });

export default mongoose.model('DistributionPoint', distributionPointSchema);
