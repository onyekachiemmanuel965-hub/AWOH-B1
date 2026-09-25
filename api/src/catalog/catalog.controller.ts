import { Controller, Get, Param, Query } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import {
  ListProductsQueryDto,
  ResolveProductsQueryDto,
} from './dto/list-products.query.dto';

@Controller('api/v1')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get('categories')
  listCategories() {
    return this.catalog.listCategories();
  }

  @Get('categories/:categorySlug')
  getCategory(@Param('categorySlug') categorySlug: string) {
    return this.catalog.getCategoryBySlug(categorySlug);
  }

  @Get('categories/:categorySlug/subcategories/:subcategorySlug')
  getSubcategory(
    @Param('categorySlug') categorySlug: string,
    @Param('subcategorySlug') subcategorySlug: string,
  ) {
    return this.catalog.getSubcategory(categorySlug, subcategorySlug);
  }

  @Get('products')
  listProducts(@Query() query: ListProductsQueryDto) {
    return this.catalog.listProducts(query);
  }

  @Get('products/resolve')
  resolveProducts(@Query() query: ResolveProductsQueryDto) {
    const ids = query.ids.split(',').map((id) => id.trim());
    return this.catalog.resolveProductsByIds(ids);
  }

  @Get('products/:slug')
  getProduct(@Param('slug') slug: string) {
    return this.catalog.getProductBySlug(slug);
  }
}
