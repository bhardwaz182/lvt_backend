import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import { join } from 'path'
import { serveStatic } from 'polka'

export default class StaticAssetsMiddleware {
    public static async handle ({ request, response }: HttpContextContract, next: () => Promise<void>) {
        await serveStatic(join(__dirname, '..', 'public'))(request.request, response.response, next)
      }
  }