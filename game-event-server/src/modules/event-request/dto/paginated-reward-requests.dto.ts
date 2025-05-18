import { RewardRequest } from '../schemas/reward-request.schema';

export class PaginatedRewardRequestsDto {
  items: RewardRequest[];
  total: number;
  page: number;
  limit: number;
  pages: number;

  constructor(items: RewardRequest[], total: number, page: number, limit: number) {
    this.items = items;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.pages = Math.ceil(total / limit);
  }
}
