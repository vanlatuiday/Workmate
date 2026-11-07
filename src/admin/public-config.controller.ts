import { Controller, Get } from '@nestjs/common'
import { SystemConfigService } from '../common/system-config.service'

@Controller('config')
export class PublicConfigController {
  constructor(private config: SystemConfigService) {}

  /** Phần cấu hình ai cũng đọc được: trọng số chấm điểm, lương tối thiểu, bán kính mặc định, đăng ký mở/đóng */
  @Get('public')
  getPublic() {
    return this.config.getPublic()
  }
}
