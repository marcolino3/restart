import { Injectable } from '@nestjs/common';
import { CreateTimeTrackingInput } from './dto/create-time-tracking.input';
import { UpdateTimeTrackingInput } from './dto/update-time-tracking.input';

@Injectable()
export class TimeTrackingService {
  create(_createTimeTrackingInput: CreateTimeTrackingInput) {
    return 'This action adds a new timeTracking';
  }

  findAll() {
    return `This action returns all timeTracking`;
  }

  findOne(id: number) {
    return `This action returns a #${id} timeTracking`;
  }

  update(id: number, _updateTimeTrackingInput: UpdateTimeTrackingInput) {
    return `This action updates a #${id} timeTracking`;
  }

  remove(id: number) {
    return `This action removes a #${id} timeTracking`;
  }
}
