// ============================================================================
// Roles & Permissions — RBAC management
// ============================================================================

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Shield, Plus } from 'lucide-react';

const roles = [
  {
    role: 'admin',
    description: 'Full access to all admin features',
    permissions: ['all'],
    users: 2,
  },
  {
    role: 'support_agent',
    description: 'Can view bookings, incidents, and support tickets',
    permissions: ['view_bookings', 'view_incidents', 'manage_tickets', 'view_providers'],
    users: 5,
  },
];

const permissionMatrix = [
  { feature: 'Dashboard', admin: true, support_agent: true },
  { feature: 'Provider Applications', admin: true, support_agent: true },
  { feature: 'Credential Verification', admin: true, support_agent: false },
  { feature: 'Bookings', admin: true, support_agent: true },
  { feature: 'Service Catalogue', admin: true, support_agent: false },
  { feature: 'Payments & Payouts', admin: true, support_agent: false },
  { feature: 'Fraud Flags', admin: true, support_agent: false },
  { feature: 'Incidents', admin: true, support_agent: true },
  { feature: 'Support Tickets', admin: true, support_agent: true },
  { feature: 'Roles & Permissions', admin: true, support_agent: false },
  { feature: 'Audit Log', admin: true, support_agent: false },
];

export function RolesPermissions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground mt-1">
            Manage RBAC for admin and support accounts
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Role
        </Button>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => (
          <Card key={role.role}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <span className="capitalize">{role.role.replace('_', ' ')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">{role.description}</p>
              <div>
                <p className="text-sm font-medium mb-2">Active Users: {role.users}</p>
              </div>
              <div>
                <p className="text-sm font-medium mb-2">Permissions</p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.map((perm) => (
                    <Badge key={perm} variant="outline" className="text-xs">
                      {perm}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Permission Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature</TableHead>
                <TableHead className="text-center">Admin</TableHead>
                <TableHead className="text-center">Support Agent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {permissionMatrix.map((row) => (
                <TableRow key={row.feature}>
                  <TableCell className="font-medium">{row.feature}</TableCell>
                  <TableCell className="text-center">
                    {row.admin ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-red-600">✗</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {row.support_agent ? (
                      <span className="text-green-600">✓</span>
                    ) : (
                      <span className="text-red-600">✗</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
