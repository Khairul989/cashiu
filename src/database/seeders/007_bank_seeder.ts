import { BaseSeeder } from '@adonisjs/lucid/seeders'
import Bank from '#models/bank'

export default class extends BaseSeeder {
    public async run() {
        const bankData = [
            { bankName: 'AFFIN BANK', abbreviation: null, swiftCode: 'PHBMMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'ALLIANCE BANK MALAYSIA BERHAD', abbreviation: null, swiftCode: 'MFBBMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'AMBANK BERHAD', abbreviation: null, swiftCode: 'ARBKMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'BANK ISLAM MALAYSIA BERHAD', abbreviation: null, swiftCode: 'BIMBMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'BANK RAKYAT BERHAD', abbreviation: null, swiftCode: 'BKRMMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'BANK MUAMALAT BERHAD', abbreviation: null, swiftCode: 'BMMBMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'BANK OF AMERICA', abbreviation: null, swiftCode: 'BOFAMY2XXXX', isActive: true, logoUrl: null },
            { bankName: 'BANK PERTANIAN MALAYSIA BERHAD (AGROBANK)', abbreviation: null, swiftCode: 'AGOBMYK1XXX', isActive: true, logoUrl: null },
            { bankName: 'BANK SIMPANAN NASIONAL', abbreviation: null, swiftCode: 'BSNAMYK1XXX', isActive: true, logoUrl: null },
            { bankName: 'CIMB BANK BERHAD', abbreviation: null, swiftCode: 'CIBBMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'CITIBANK BERHAD', abbreviation: null, swiftCode: 'CITIMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'DEUSTCHE BANK', abbreviation: null, swiftCode: 'DEUTMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'HONG LEONG BANK BERHAD', abbreviation: null, swiftCode: 'HLBBMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'HSBC BANK MALAYSIA BERHAD', abbreviation: null, swiftCode: 'HBMBMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'J.P. MORGAN CHASE BANK BERHAD', abbreviation: null, swiftCode: 'CHASMYKXXXX', isActive: true, logoUrl: null },
            { bankName: 'KUWAIT FINANCE HOUSE (MALAYSIA) BHD', abbreviation: null, swiftCode: 'KFHOMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'MALAYAN BANKING BERHAD', abbreviation: null, swiftCode: 'MBBEMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'OCBC BANK (M) BERHAD', abbreviation: null, swiftCode: 'OCBCMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'PUBLIC BANK BERHAD', abbreviation: null, swiftCode: 'PBBEMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'RHB BANK BERHAD', abbreviation: null, swiftCode: 'RHBBMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'STANDARD CHARTERED BANK MSIA BHD', abbreviation: null, swiftCode: 'SCBLMYKXXXX', isActive: true, logoUrl: null },
            { bankName: 'UNITED OVERSEAS BANK', abbreviation: null, swiftCode: 'UOVBMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'MAYBANK ISLAMIC BERHAD', abbreviation: null, swiftCode: 'MBISMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'PUBLIC ISLAMIC BANK BERHAD', abbreviation: null, swiftCode: 'PUIBMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'RHB ISLAMIC BANK BERHAD', abbreviation: null, swiftCode: 'RHBAMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'HONG LEONG ISLAMIC BANK BERHAD', abbreviation: null, swiftCode: 'HLIBMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'AFFIN ISLAMIC BANK BERHAD', abbreviation: null, swiftCode: 'AIBBMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'ALLIANCE ISLAMIC BANK BERHAD', abbreviation: null, swiftCode: 'ALSRMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'AMBANK ISLAMIC BERHAD', abbreviation: null, swiftCode: 'AISLMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'CIMB ISLAMIC BANK BERHAD', abbreviation: null, swiftCode: 'CTBBMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'MBSB BANK BERHAD', abbreviation: null, swiftCode: 'AFBQMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'HSBC AMANAH MALAYSIA BERHAD', abbreviation: null, swiftCode: 'HMABMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'AL RAJHI BANKING AND INVESTMENT CORPORATION (MALAYSIA) BHD', abbreviation: null, swiftCode: 'RJHIMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'BANK PERTANIAN MALAYSIA BERHAD-AGROBANK', abbreviation: null, swiftCode: 'AGOBMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'STANDARD CHARTERED SAADIQ BERHAD', abbreviation: null, swiftCode: 'SCSRMYKKXXX', isActive: true, logoUrl: null },
            { bankName: 'MIZUHO BANK (MALAYSIA) BERHAD', abbreviation: null, swiftCode: 'MHCBMYKAXXX', isActive: true, logoUrl: null },
            { bankName: 'MUFG BANK (MALAYSIA) BERHAD', abbreviation: null, swiftCode: 'BOTKMYKXXXX', isActive: true, logoUrl: null },
            { bankName: 'OCBC AL-AMIN BANK BERHAD', abbreviation: null, swiftCode: 'OABBMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'BANGKOK BANK BERHAD', abbreviation: null, swiftCode: 'BKKBMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'BANK OF CHINA (MALAYSIA) BERHAD', abbreviation: null, swiftCode: 'BKCHMYKLXXX', isActive: true, logoUrl: null },
            { bankName: 'CHINA CONSTRUCTION BANK (MALAYSIA) BERHAD', abbreviation: null, swiftCode: 'PCBCMYKLXXX', isActive: true, logoUrl: null },
        ]

        await Bank.createMany(bankData)
    }
}
