import { Controller, Get, Param } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('api/v1/locations')
export class LocationsController {
  constructor(private readonly locations: LocationsService) {}

  @Get('states')
  listStates() {
    return this.locations.listStates();
  }

  @Get('states/:stateId/lgas')
  listLgas(@Param('stateId') stateId: string) {
    return this.locations.listLgas(stateId);
  }

  @Get('lgas/:lgaId/towns')
  listTowns(@Param('lgaId') lgaId: string) {
    return this.locations.listTowns(lgaId);
  }
}
