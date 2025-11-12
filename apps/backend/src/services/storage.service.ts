// ANTES:
// import { supabaseAdmin } from '../config/supabaseAdmin'

// DESPUÉS:
import { promises as fs } from 'fs' // Usamos el API de promesas de File System
import path from 'path' // Para construir rutas de forma segura
import { AppError } from '../middlewares/errorHandler'

export class StorageService {
  // 1. Ruta PRIVADA en el disco de la VPS donde se guardan los archivos
  // Hacemos que sea configurable desde .env, con un default.
  private storagePath: string = process.env.STORAGE_PATH || '/var/www/uploads'

  // 2. Ruta PÚBLICA que usará el frontend para acceder a la imagen.
  // Nginx mapeará esta ruta a la carpeta 'storagePath'.
  private publicUrlPath: string = process.env.PUBLIC_URL_PATH || '/uploads'

  /**
   * Asegura que el directorio de almacenamiento exista.
   */
  private async ensureDirectoryExists(): Promise<void> {
    try {
      // { recursive: true } es como 'mkdir -p', crea directorios anidados si no existen.
      await fs.mkdir(this.storagePath, { recursive: true })
    } catch (error: any) {
      console.error(`[StorageService] Failed to create storage directory: ${this.storagePath}`, error)
      throw new AppError('Failed to initialize storage', 500)
    }
  }

  async uploadImage(file: Buffer, fileName: string, contentType: string): Promise<string> {
    // 3. Creamos un nombre de archivo único, igual que antes.
    const timestamp = Date.now()
    // Usamos path.basename para limpiar el nombre y evitar ataques (ej. ../../)
    const uniqueFileName = `${timestamp}-${path.basename(fileName)}`

    // 4. Construimos la ruta COMPLETA del archivo en el disco
    const filePath = path.join(this.storagePath, uniqueFileName)

    try {
      // 5. Aseguramos que la carpeta exista antes de escribir
      await this.ensureDirectoryExists()
      
      // 6. Escribimos el buffer del archivo en el disco
      await fs.writeFile(filePath, file)

      // 7. Devolvemos la RUTA PÚBLICA, no la del disco.
      // Ej: /uploads/123456-mi-imagen.png
      // (Usamos '/' en lugar de path.join para URLs)
      const publicUrl = `${this.publicUrlPath}/${uniqueFileName}`
      
      return publicUrl
    } catch (error: any) {
      console.error(`[StorageService] Failed to upload image to ${filePath}`, error)
      throw new AppError(error.message, 400)
    }
  }

  async deleteImage(imageUrl: string): Promise<void> {
    // 8. Extraemos el nombre del archivo de la URL
    // path.basename() funciona perfecto para esto.
    // Ej: /uploads/123456-mi-imagen.png -> 123456-mi-imagen.png
    const fileName = path.basename(imageUrl)
    
    if (!fileName) {
      throw new AppError('Invalid image URL', 400)
    }

    // 9. Construimos la ruta COMPLETA del archivo en el disco
    const filePath = path.join(this.storagePath, fileName)

    try {
      // 10. Borramos el archivo
      await fs.unlink(filePath)
    } catch (error: any) {
      // Si el archivo no existe (ENOENT), no lanzamos error.
      // Simplemente significa que ya está borrado.
      if (error.code === 'ENOENT') {
        console.warn(`[StorageService] Image not found, skipping delete: ${filePath}`)
        return
      }
      
      // Para cualquier otro error (ej. permisos), sí lanzamos.
      console.error(`[StorageService] Failed to delete image ${filePath}`, error)
      throw new AppError(error.message, 400)
    }
  }

  // --- ¡ESTE MÉTODO NO NECESITA CAMBIOS! ---
  // Su lógica es abstracta y depende de `this.deleteImage` y `this.uploadImage`.
  // Como refactorizamos esos dos, este simplemente funcionará. ¡Genial!
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