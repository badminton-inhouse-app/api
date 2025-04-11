import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { LoyaltyService } from './loyalty.service';
import { CreateLoyaltyDto } from './dto/create-loyalty.dto';
import { UpdateLoyaltyDto } from './dto/update-loyalty.dto';

@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Post()
  create(@Body() createLoyaltyDto: CreateLoyaltyDto) {
    return this.loyaltyService.create(createLoyaltyDto);
  }

  @Get()
  findAll() {
    return this.loyaltyService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.loyaltyService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateLoyaltyDto: UpdateLoyaltyDto) {
    return this.loyaltyService.update(+id, updateLoyaltyDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.loyaltyService.remove(+id);
  }
}
