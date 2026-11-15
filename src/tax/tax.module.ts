import { Global, Module } from '@nestjs/common'
import { TaxLookupService } from './tax-lookup.service'

@Global()
@Module({ providers: [TaxLookupService], exports: [TaxLookupService] })
export class TaxModule {}
