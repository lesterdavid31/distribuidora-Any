import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
})

export const listItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().positive('La cantidad debe ser mayor a 0').optional(),
  unit: z.string().trim().max(20).optional(),
})

export const createListSchema = z.object({
  title: z.string().trim().min(1, 'El título es obligatorio').max(120),
  buyerId: z.string().optional().nullable(),
  items: z.array(listItemInputSchema).min(1, 'Agrega al menos un producto'),
})

export const updateListSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  buyerId: z.string().nullable().optional(),
  purchaseDate: z.string().nullable().optional(),
})

/** Regla de negocio: al marcar la casilla, el precio de compra es OBLIGATORIO; el de venta es opcional */
export const patchItemSchema = z
  .object({
    checked: z.boolean(),
    purchasePrice: z.coerce.number().positive('El precio de compra debe ser mayor a 0').nullable().optional(),
    salePrice: z.coerce.number().positive('El precio de venta debe ser mayor a 0').nullable().optional(),
    quantity: z.coerce.number().positive().nullable().optional(),
    unit: z.string().trim().max(20).nullable().optional(),
  })
  .refine((data) => !data.checked || (data.purchasePrice != null && data.purchasePrice > 0), {
    message: 'El precio de compra es obligatorio al marcar el producto',
    path: ['purchasePrice'],
  })

export const shareListSchema = z.object({
  userId: z.string().min(1, 'Selecciona un usuario'),
})

const roleName = z.enum(['ADMIN', 'COMPRADOR', 'VENDEDOR'])

export const adminCreateUserSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es obligatorio').max(80),
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  roles: z.array(roleName).min(1, 'Asigna al menos un rol'),
})

export const adminUpdateUserSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  roles: z.array(roleName).min(1).optional(),
  active: z.boolean().optional(),
  password: z.string().min(6, 'Mínimo 6 caracteres').optional().or(z.literal('')),
})

export const adminProductSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio').max(80),
  icon: z.string().trim().min(1, 'El icono es obligatorio').max(8),
  categoryId: z.string().min(1, 'Selecciona una categoría'),
  visible: z.boolean().optional(),
  order: z.coerce.number().int().min(0).optional(),
})

export const adminUpdateProductSchema = adminProductSchema.partial()
