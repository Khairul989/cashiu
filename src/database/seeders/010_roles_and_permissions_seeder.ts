import Conversion from '#models/conversion'
import User from '#models/user'
import Withdrawal from '#models/withdrawal'
import { BaseSeeder } from '@adonisjs/lucid/seeders'
import { LucidModel } from '@adonisjs/lucid/types/model'
import { Acl } from '@holoyan/adonisjs-permissions'
import { RoleInterface } from '@holoyan/adonisjs-permissions/types'

export default class extends BaseSeeder {
  async run() {
    await this.createSuperAdminRole()
    await this.createAdminFinanceRole()
    await this.createDefaultRole()
  }

  async createSuperAdminRole() {
    const superAdmin = await Acl.role().create({
      slug: 'superadmin',
      title: 'Super Admin',
    })

    const admin = await User.firstOrFail()

    await Acl.model(admin).assignRole(superAdmin.slug)
  }

  async createDefaultRole() {
    const defaultRole = await Acl.role().create({
      slug: 'default',
      title: 'Default admin role',
    })

    const permissions = [
      {
        permission: 'read',
        model: Withdrawal,
      },
      {
        permission: 'read',
        model: Conversion,
      },
    ]

    await this.assignPermissionsToRole(defaultRole, permissions)
  }

  async createAdminFinanceRole() {
    const adminFinance = await Acl.role().create({
      slug: 'finance',
      title: 'Finance',
    })

    const permissions = [
      {
        permission: 'update',
        model: Withdrawal,
      },
      {
        permission: 'update',
        model: Conversion,
      },
    ]

    await this.assignPermissionsToRole(adminFinance, permissions)
  }

  async assignPermissionsToRole(
    role: RoleInterface,
    permissions: { permission: string; model: LucidModel }[]
  ) {
    for (const permission of permissions) {
      await Acl.role(role).allow(permission.permission, permission.model)
    }
  }
}
