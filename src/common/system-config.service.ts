import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import type { PublicConfig, SystemConfigDto } from '../catalog/catalog.types'

/** Mặc định giống DEFAULT_CONFIG ở frontend (adminStore) */
export const DEFAULT_CONFIG: SystemConfigDto = {
  weights: { skills: 35, schedule: 25, salary: 16, distance: 14, jobType: 10 },
  bannedWords: ['đặt cọc', 'phí giữ chỗ', 'việc nhẹ lương cao', 'chuyển khoản trước'],
  minWageK: 20,
  defaultRadiusKm: 8,
  registrationOpen: true,
}

/** Đọc / ghi dòng cấu hình hệ thống duy nhất (id = 1) */
@Injectable()
export class SystemConfigService {
  constructor(private prisma: PrismaService) {}

  async get(): Promise<SystemConfigDto> {
    const row = await this.prisma.systemConfig.findUnique({ where: { id: 1 } })
    if (!row) return DEFAULT_CONFIG
    return {
      weights: row.weights as unknown as SystemConfigDto['weights'],
      bannedWords: row.bannedWords,
      minWageK: row.minWageK,
      defaultRadiusKm: row.defaultRadiusKm,
      registrationOpen: row.registrationOpen,
    }
  }

  /** Gộp phần thay đổi vào cấu hình hiện có rồi lưu */
  async update(patch: Partial<SystemConfigDto>): Promise<SystemConfigDto> {
    // Bỏ trường undefined (DTO có thể chứa khóa rỗng) và đổi weights về object thường để Prisma nhận
    const defined = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as Partial<SystemConfigDto>
    const next = { ...(await this.get()), ...defined }
    if (defined.weights) next.weights = { ...defined.weights }
    await this.prisma.systemConfig.upsert({
      where: { id: 1 },
      create: { id: 1, ...next },
      update: next,
    })
    return next
  }

  async getPublic(): Promise<PublicConfig> {
    const { weights, minWageK, defaultRadiusKm, registrationOpen } = await this.get()
    return { weights, minWageK, defaultRadiusKm, registrationOpen }
  }
}
