import { supabaseAdmin } from '../config/supabaseAdmin'
import { AppError } from '../middlewares/errorHandler'

export class StorageService {
  private bucketName = 'public-images'

  async uploadImage(file: Buffer, fileName: string, contentType: string): Promise<string> {
    const timestamp = Date.now()
    const uniqueFileName = `${timestamp}-${fileName}`

    const { data, error } = await supabaseAdmin.storage
      .from(this.bucketName)
      .upload(uniqueFileName, file, {
        contentType,
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw new AppError(error.message, 400)

    const { data: urlData } = supabaseAdmin.storage
      .from(this.bucketName)
      .getPublicUrl(data.path)

    return urlData.publicUrl
  }

  async deleteImage(imageUrl: string): Promise<void> {
    const fileName = imageUrl.split('/').pop()
    
    if (!fileName) {
      throw new AppError('Invalid image URL', 400)
    }

    const { error } = await supabaseAdmin.storage
      .from(this.bucketName)
      .remove([fileName])

    if (error) throw new AppError(error.message, 400)
  }

  async updateImage(oldImageUrl: string | null, file: Buffer, fileName: string, contentType: string): Promise<string> {
    if (oldImageUrl) {
      try {
        await this.deleteImage(oldImageUrl)
      } catch (error) {
        console.error('Error deleting old image:', error)
      }
    }

    return this.uploadImage(file, fileName, contentType)
  }
}