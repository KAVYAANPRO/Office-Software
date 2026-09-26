import { Controller, Get, Post, Query } from '@nestjs/common';
import { StockQueryService } from './stock-query.service';
import { StockService } from './stock.service';
import { StockItemsService } from './stock-items.service';
import { ReconciliationService } from './reconciliation.service';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../identity/permissions.catalogue';

@Controller('api/v1/stock')
export class StockQueryController {
  constructor(
    private readonly queryService: StockQueryService,
    private readonly stockService: StockService,
    private readonly stockItemsService: StockItemsService,
    private readonly reconciliationService: ReconciliationService,
  ) {}

  @RequirePermissions(PERMISSIONS.STOCK_VIEW)
  @Get('items')
  listItems(@Query('kind') kind?: string) {
    return this.stockItemsService.list(kind ? { kind } : {});
  }

  @RequirePermissions(PERMISSIONS.STOCK_VIEW)
  @Get('balances')
  balances(@Query('stockItemId') stockItemId?: string, @Query('locationId') locationId?: string) {
    return this.queryService.balances({ stockItemId, locationId });
  }

  @RequirePermissions(PERMISSIONS.STOCK_LEDGER_VIEW)
  @Get('ledger')
  ledger(@Query('stockItemId') stockItemId: string, @Query('limit') limit?: string) {
    return this.stockService.ledgerForItem(stockItemId, limit ? parseInt(limit, 10) : undefined);
  }

  @RequirePermissions(PERMISSIONS.STOCK_VIEW)
  @Get('lots')
  lots(@Query('stockItemId') stockItemId?: string) {
    return this.queryService.lots({ stockItemId });
  }

  @RequirePermissions(PERMISSIONS.STOCK_VALUE_VIEW)
  @Get('valuation')
  valuation(@Query('stockItemId') stockItemId?: string) {
    return this.queryService.valuation({ stockItemId });
  }

  @RequirePermissions(PERMISSIONS.STOCK_VIEW)
  @Get('availability')
  availability(@Query('stockItemIds') stockItemIds: string) {
    const ids = stockItemIds
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    return this.stockService.availability(ids);
  }

  @RequirePermissions(PERMISSIONS.STOCK_VIEW)
  @Get('low-stock')
  lowStock() {
    return this.queryService.lowStock();
  }

  @RequirePermissions(PERMISSIONS.STOCK_VIEW)
  @Get('reconciliation')
  reconciliationHistory() {
    return this.reconciliationService.latest();
  }

  /** Manual trigger for the nightly reconciliation job (STK-10), for ops and for tests. */
  @RequirePermissions(PERMISSIONS.STOCK_ADJUST_APPROVE)
  @Post('reconciliation/run')
  runReconciliation() {
    return this.reconciliationService.run();
  }
}
