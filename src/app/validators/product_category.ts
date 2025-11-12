import vine from '@vinejs/vine';

export const productCategoryIndexValidator = vine.compile(
  vine.object({
    categoryLevel: vine.number().optional(),
    search: vine.string().optional(),
    sort: vine.enum(['categoryName']).optional(),
    order: vine.enum(['asc', 'desc']).optional().requiredIfExists('sort'),
    page: vine.number().withoutDecimals(),
    limit: vine.number().withoutDecimals(),
    random: vine.number().optional(),
  })
);

export const productCategoryGetSubcategoriesValidator = vine.compile(
  vine.object({
    categoryId: vine.number(),
  })
);