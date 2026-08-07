export interface ServerItem {
  id: string
  name: string
  status: 'active' | 'suspended'
  nodeVersion: string
  storageType: string
  activeUntil: string
  createdDate: string
  ipAddress?: string
  panelUsername?: string
  panelPassword?: string
  specs?: {
    cpu: string
    ram: string
    storage: string
    bandwidth: string
  }
}

export interface StatItem {
  id: string
  title: string
  value: string | number
  color: 'green' | 'red' | 'purple' | 'blue'
  iconName: string
  trendIcon: string
}

export interface ProductItem {
  id: string
  name: string
  badge: string
  price: string
  period: string
  specs: {
    cpu: string
    ram: string
    storage: string
    bandwidth: string
  }
}

export interface GuideStep {
  step: number
  title: string
  description: string
}

export const dashboardData = {
  user: {
    name: 'Ichanzx',
    username: 'ichanzx',
    email: 'ichanzx@zxcoderid.com',
    avatar: 'I',
  },
  stats: [
    {
      id: 'active-servers',
      title: 'Server aktif',
      value: 1,
      color: 'green',
      iconName: 'Server',
      trendIcon: 'TrendingUp',
    },
    {
      id: 'suspended-servers',
      title: 'Server Suspended',
      value: 1,
      color: 'red',
      iconName: 'Disc',
      trendIcon: 'BarChart2',
    },
    {
      id: 'total-transactions',
      title: 'Transaction Total',
      value: 0,
      color: 'purple',
      iconName: 'CreditCard',
      trendIcon: 'TrendingUp',
    },
    {
      id: 'joined-since',
      title: 'Bergabung sejak',
      value: '25 Juli 2026',
      color: 'blue',
      iconName: 'Calendar',
      trendIcon: 'TrendingUp',
    },
  ] as StatItem[],
  servers: [
    {
      id: 'srv-01',
      name: 'Server Punya IchanZX - 01',
      status: 'active',
      nodeVersion: 'NodeJS 22',
      storageType: 'NVMe SSD',
      activeUntil: '29 Agustus 2026',
      createdDate: '29 Agustus 2026',
      ipAddress: '103.147.222.10:2022',
      panelUsername: 'ichanzx_node01',
      panelPassword: 'P@ssw0rdZXcoder2026!',
      specs: {
        cpu: '30% CPU Allocation',
        ram: '1 GB RAM Allocation',
        storage: '20 GB NVMe SSD',
        bandwidth: 'Unlimited Bandwidth',
      },
    },
    {
      id: 'srv-02',
      name: 'Tes Wa Bot Tools',
      status: 'suspended',
      nodeVersion: 'NodeJS 22',
      storageType: 'NVMe SSD',
      activeUntil: '30 Juli 2026',
      createdDate: '30 Juli 2026',
      ipAddress: '103.147.222.11:2022',
      panelUsername: 'ichanzx_wabot',
      panelPassword: 'WaBotSecurePassword#99',
      specs: {
        cpu: '30% CPU Allocation',
        ram: '1 GB RAM Allocation',
        storage: '20 GB NVMe SSD',
        bandwidth: 'Unlimited Bandwidth',
      },
    },
  ] as ServerItem[],
}

export const productsData: ProductItem[] = [
  {
    id: 'prod-1',
    name: 'Starter',
    badge: 'Nord Java',
    price: 'Rp 10.000',
    period: '/ Month',
    specs: {
      cpu: '30% CPU Allocation',
      ram: '1GB Ram Allocation',
      storage: '20GB Storage',
      bandwidth: 'Unlimited BandWidth',
    },
  },
  {
    id: 'prod-2',
    name: 'Starter',
    badge: 'Nord Java',
    price: 'Rp 10.000',
    period: '/ Month',
    specs: {
      cpu: '30% CPU Allocation',
      ram: '1GB Ram Allocation',
      storage: '20GB Storage',
      bandwidth: 'Unlimited BandWidth',
    },
  },
  {
    id: 'prod-3',
    name: 'Starter',
    badge: 'Nord Java',
    price: 'Rp 10.000',
    period: '/ Month',
    specs: {
      cpu: '30% CPU Allocation',
      ram: '1GB Ram Allocation',
      storage: '20GB Storage',
      bandwidth: 'Unlimited BandWidth',
    },
  },
  {
    id: 'prod-4',
    name: 'Starter',
    badge: 'Nord Java',
    price: 'Rp 10.000',
    period: '/ Month',
    specs: {
      cpu: '30% CPU Allocation',
      ram: '1GB Ram Allocation',
      storage: '20GB Storage',
      bandwidth: 'Unlimited BandWidth',
    },
  },
  {
    id: 'prod-5',
    name: 'Starter',
    badge: 'Nord Java',
    price: 'Rp 10.000',
    period: '/ Month',
    specs: {
      cpu: '30% CPU Allocation',
      ram: '1GB Ram Allocation',
      storage: '20GB Storage',
      bandwidth: 'Unlimited BandWidth',
    },
  },
  {
    id: 'prod-6',
    name: 'Starter',
    badge: 'Nord Java',
    price: 'Rp 10.000',
    period: '/ Month',
    specs: {
      cpu: '30% CPU Allocation',
      ram: '1GB Ram Allocation',
      storage: '20GB Storage',
      bandwidth: 'Unlimited BandWidth',
    },
  },
  {
    id: 'prod-7',
    name: 'Starter',
    badge: 'Nord Java',
    price: 'Rp 10.000',
    period: '/ Month',
    specs: {
      cpu: '30% CPU Allocation',
      ram: '1GB Ram Allocation',
      storage: '20GB Storage',
      bandwidth: 'Unlimited BandWidth',
    },
  },
  {
    id: 'prod-8',
    name: 'Starter',
    badge: 'Nord Java',
    price: 'Rp 10.000',
    period: '/ Month',
    specs: {
      cpu: '30% CPU Allocation',
      ram: '1GB Ram Allocation',
      storage: '20GB Storage',
      bandwidth: 'Unlimited BandWidth',
    },
  },
]

export const guideStepsData: GuideStep[] = [
  {
    step: 1,
    title: 'Login Panel',
    description:
      'Login to the panel using the account associated with your email (your panel username and password were automatically sent when you first ordered the server). Open your server via the "My Servers" menu, then click "Manage Login to Panel".',
  },
  {
    step: 2,
    title: 'Upload Script Bot',
    description:
      'Prepare your WhatsApp bot script (you can get one from a YouTube tutorial; it usually comes in .zip format). Open the File Manager tab in the panel, then click the Upload button and select that .zip file.',
  },
  {
    step: 3,
    title: 'Unarchive (Extract) File',
    description:
      'Once the .zip file has finished uploading, right-click the file and select Unarchive to extract its contents. Wait for the process to complete.',
  },
  {
    step: 4,
    title: 'Start Panel Console',
    description:
      'Open the Console tab, then click the Start button. Wait for the installation process to complete. If the bot asks to scan a WhatsApp QR or pairing code, the code will appear in the Console; simply scan it using your WhatsApp.',
  },
]
