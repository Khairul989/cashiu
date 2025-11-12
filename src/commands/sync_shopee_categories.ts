import axios from 'axios';
import { BaseCommand } from '@adonisjs/core/ace';
import { CommandOptions } from '@adonisjs/core/types/ace';
import db from '@adonisjs/lucid/services/db';
import { ShopeeCategory, ShopeeCategoryApiResponse, ShopeeCategoryPath } from '#types/shopee_category';

export default class SyncShopeeCategories extends BaseCommand {
    static commandName = 'sync:shopee-categories';
    static description = 'Fetch and save Shopee product categories into the database';

    static options: CommandOptions = { startApp: true, }

    private baseUrl = 'https://seller.shopee.com.my/help/api/v3/global_category/list/';

    async run() {
        this.logger.info('Starting to sync Shopee categories...');

        try {
            // Fetch all categories from the API
            const allCategories = await this.fetchAllCategories();

            if (allCategories.length === 0) {
                this.logger.info('No categories found to sync.');
                return;
            }

            // Insert all categories into the database
            await this.batchInsertCategories(allCategories);

            this.logger.info('Shopee categories sync completed.');
        } catch (error) {
            this.logger.error(`Sync failed: ${error.message}`);
        }
    }

    private async fetchAllCategories(): Promise<ShopeeCategory[]> {
        let allCategories: ShopeeCategory[] = [];
        let page = 1;
        const pageSize = 1000;

        while (true) {
            const response = await this.fetchCategories(page, pageSize) as { data: ShopeeCategoryApiResponse };
            const data = response.data?.data;

            // stop if the response is invalid or empty
            if (!data || !data.global_cats || data.global_cats.length === 0) {
                break;
            }

            // append the fetched categories to the existing list
            allCategories = allCategories.concat(data.global_cats);
            page++;

            // stop if there are no more pages
            if (data.total !== undefined && page > Math.ceil(data.total / pageSize)) {
                break;
            }
        }

        return allCategories;
    }

    private async batchInsertCategories(categories: ShopeeCategory[]) {
        // get existing categories from db
        const existingCategories = await db.rawQuery(
            `SELECT category_id FROM product_categories`
        );
        const existingCategoryIds = new Set<number>(existingCategories[0].map((row: { category_id: number }) => row.category_id));

        // filter out categories that already exist in the database
        const categoriesToInsert = categories
            .flatMap((category) => this.prepareCategoriesForInsertion(category, existingCategoryIds))
            .filter(Boolean);

        // insert new categories into db if any
        if (categoriesToInsert.length > 0) {
            await db.transaction(async (trx) => {
                await trx.table('product_categories').insert(categoriesToInsert);
            });

            this.logger.info(`${categoriesToInsert.length} categories inserted successfully.`);
        } else {
            this.logger.info('No new categories to insert.');
        }
    }

    private async fetchCategories(page: number, pageSize: number) {
        try {
            const response = await axios.get(this.baseUrl, {
                params: { page, size: pageSize },
            });

            if (!response.data) {
                throw new Error('Invalid API response: Missing `data` property');
            }

            return response;
        } catch (error) {
            this.logger.error(`Failed to fetch categories for page ${page}: ${error.message}`);
            throw error;
        }
    }

    private prepareCategoriesForInsertion(category: ShopeeCategory, existingCategoryIds: Set<number>) {
        return category.path.map((pathCategory) => {
            if (existingCategoryIds.has(pathCategory.category_id)) {
                return null;
            }

            const path = this.constructPath(category.path, pathCategory.category_id);
            const sanitizedImageUrls = this.sanitizeImageUrls(category.images);

            existingCategoryIds.add(pathCategory.category_id);

            return {
                category_id: pathCategory.category_id,
                category_name: pathCategory.category_name,
                image_urls: JSON.stringify(sanitizedImageUrls),
                path: JSON.stringify(path),
                created_at: new Date(),
                updated_at: new Date(),
            };
        });
    }

    private constructPath(path: ShopeeCategoryPath[], categoryId: number) {
        return path
            .slice(0, path.findIndex((p) => p.category_id === categoryId) + 1)
            .map((p) => p.category_id);
    }

    private sanitizeImageUrls(images: string[] = []) {
        return images.map((url: string) => url.trim());
    }
}