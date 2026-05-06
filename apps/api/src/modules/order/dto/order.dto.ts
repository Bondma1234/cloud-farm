import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class OrderListQueryDto {
  @ApiProperty({
    required: false,
    description: '过滤状态: pending/paid/shipped/delivering/completed/growing/cancelled',
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class OrderItemMetaDto {
  @ApiProperty({ required: false }) timeline?: { at: string; event: string; done: boolean }[];
  @ApiProperty({ required: false }) logistics?: {
    company: string;
    no: string;
    nodes: { at: string; node: string }[];
  };
  @ApiProperty({ required: false }) subItems?: { label: string; value: string }[];
  @ApiProperty({ required: false }) expireIn?: string;
  @ApiProperty({ required: false }) canReview?: boolean;
}

export class OrderDto {
  @ApiProperty({ example: 'ORD-2026-0418' })
  id!: string;

  @ApiProperty({ example: '认养' })
  type!: string;

  @ApiProperty({ example: '🌱' })
  typeIcon!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  cover!: string;

  @ApiProperty({ example: 799 })
  price!: number;

  @ApiProperty({ example: 1 })
  count!: number;

  @ApiProperty({ example: 'growing' })
  status!: string;

  @ApiProperty({ example: '种植中' })
  statusLabel!: string;

  @ApiProperty({ example: '2026-03-01' })
  date!: string;

  @ApiProperty({ required: false })
  packageId?: string;

  @ApiProperty({ required: false })
  addressId?: string;

  @ApiProperty({ type: () => OrderItemMetaDto, required: false })
  meta?: OrderItemMetaDto;
}
