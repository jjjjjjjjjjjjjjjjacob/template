import * as React from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { VirtualDataTable } from '@/components/ui/virtual-data-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Copy } from 'lucide-react';
import { cn } from '@/utils/tailwind-utils';

// Example data type
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  status: 'active' | 'inactive' | 'pending';
  lastSeen: Date;
  posts: number;
}

// Generate sample data
const generateSampleUsers = (count: number): User[] => {
  const roles: User['role'][] = ['admin', 'user', 'moderator'];
  const statuses: User['status'][] = ['active', 'inactive', 'pending'];
  const names = [
    'alice johnson',
    'bob smith',
    'charlie brown',
    'diana prince',
    'eve adams',
    'frank castle',
    'grace kelly',
    'henry ford',
    'iris west',
    'jack ryan',
    'karen page',
    'luke cage',
    'mary jane',
    'nick fury',
    'olivia pope',
    'peter parker',
    'quinn fabray',
    'rick grimes',
    'sarah connor',
    'tony stark',
  ];

  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i + 1}`,
    name:
      names[i % names.length] +
      (i >= names.length ? ` ${Math.floor(i / names.length) + 1}` : ''),
    email: `user${i + 1}@example.com`,
    role: roles[Math.floor(Math.random() * roles.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    lastSeen: new Date(
      Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000
    ),
    posts: Math.floor(Math.random() * 1000),
  }));
};

const sampleData = generateSampleUsers(250); // Large dataset to trigger virtualization

export function DataTableExample() {
  const [data] = React.useState<User[]>(sampleData);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: 'name',
      cell: ({ row }) => (
        <div className="font-light">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'email',
      cell: ({ row }) => (
        <div className="text-muted-foreground">{row.getValue('email')}</div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'role',
      cell: ({ row }) => {
        const role = row.getValue('role') as string;
        return (
          <Badge
            variant={
              role === 'admin'
                ? 'default'
                : role === 'moderator'
                  ? 'secondary'
                  : 'outline'
            }
            className="capitalize"
          >
            {role}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'status',
      header: 'status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        return (
          <Badge
            variant={
              status === 'active'
                ? 'default'
                : status === 'pending'
                  ? 'secondary'
                  : 'destructive'
            }
            className={cn(
              'capitalize',
              status === 'active' &&
                'bg-green-100 text-green-800 hover:bg-green-100',
              status === 'pending' &&
                'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
              status === 'inactive' &&
                'bg-red-100 text-red-800 hover:bg-red-100'
            )}
          >
            {status}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'posts',
      header: 'posts',
      cell: ({ row }) => (
        <div className="text-right">{row.getValue('posts')}</div>
      ),
    },
    {
      accessorKey: 'lastSeen',
      header: 'last seen',
      cell: ({ row }) => {
        const date = row.getValue('lastSeen') as Date;
        return (
          <div className="text-muted-foreground">
            {date.toLocaleDateString()}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: 'actions',
      cell: () => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              /* Edit functionality */
            }}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              /* Copy functionality */
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
  ];

  const handleExport = () => {
    // console.log('Exporting:', selectedRows.length, 'rows');
    // Implement actual export logic here
  };

  const handleBulkDelete = () => {
    // console.log(
    //   'Bulk delete:',
    //   selectedRows.map((row) => row.id)
    // );
    // Implement bulk delete logic here
  };

  const handleBulkStatusChange = () => {
    // console.log(
    //   'Bulk status change:',
    //   selectedRows.map((row) => row.id)
    // );
    // Implement bulk status change logic here
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-light tracking-tight">users management</h2>
        <p className="text-muted-foreground">
          manage user accounts and permissions. this table demonstrates
          virtualization with {data.length} rows.
        </p>
      </div>

      <VirtualDataTable
        columns={columns}
        data={data}
        enableRowSelection
        enableVirtualization
        virtualThreshold={100}
        globalFilter={globalFilter}
        onGlobalFilterChange={setGlobalFilter}
        onExport={handleExport}
        exportFormats={['csv', 'json', 'xlsx']}
        bulkActions={[
          {
            label: 'delete selected',
            action: handleBulkDelete,
            variant: 'destructive',
          },
          {
            label: 'activate selected',
            action: handleBulkStatusChange,
            variant: 'outline',
          },
        ]}
        aria-label="users data table"
        className="w-full"
      />
    </div>
  );
}
