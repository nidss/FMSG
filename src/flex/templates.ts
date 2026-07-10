// Ready-to-use templates (plain flex JSON — uids are assigned when loaded).

export interface Template {
  id: string
  name: string
  description: string
  json: any
}

const IMG = 'https://developers-resource.landpress.line.me/fx/img'

export const TEMPLATES: Template[] = [
  {
    id: 'restaurant',
    name: 'ร้านอาหาร / คาเฟ่',
    description: 'การ์ดร้านพร้อมรูป คะแนน และปุ่ม',
    json: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: `${IMG}/01_1_cafe.png`,
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: 'Brown Cafe', weight: 'bold', size: 'xl' },
          {
            type: 'box',
            layout: 'baseline',
            margin: 'md',
            contents: [
              { type: 'icon', size: 'sm', url: 'https://api.iconify.design/lucide/star.svg?color=%23f5a623' },
              { type: 'icon', size: 'sm', url: 'https://api.iconify.design/lucide/star.svg?color=%23f5a623' },
              { type: 'icon', size: 'sm', url: 'https://api.iconify.design/lucide/star.svg?color=%23f5a623' },
              { type: 'icon', size: 'sm', url: 'https://api.iconify.design/lucide/star.svg?color=%23f5a623' },
              { type: 'icon', size: 'sm', url: 'https://api.iconify.design/lucide/star.svg?color=%23d9d9d9' },
              { type: 'text', text: '4.0', size: 'sm', color: '#999999', margin: 'md', flex: 0 },
            ],
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: 'Place', color: '#aaaaaa', size: 'sm', flex: 1 },
                  { type: 'text', text: 'Flex Tower, 7-7-4 Midori-ku, Tokyo', wrap: true, color: '#666666', size: 'sm', flex: 5 },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: 'Time', color: '#aaaaaa', size: 'sm', flex: 1 },
                  { type: 'text', text: '10:00 - 23:00', wrap: true, color: '#666666', size: 'sm', flex: 5 },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        flex: 0,
        contents: [
          { type: 'button', style: 'link', height: 'sm', action: { type: 'uri', label: 'CALL', uri: 'https://line.me/' } },
          { type: 'button', style: 'link', height: 'sm', action: { type: 'uri', label: 'WEBSITE', uri: 'https://line.me/' } },
        ],
      },
    },
  },
  {
    id: 'receipt',
    name: 'ใบเสร็จ (ผูกข้อมูล)',
    description: 'ใบเสร็จที่ bind ข้อมูลจาก data source ด้วย {{...}}',
    json: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'text', text: 'RECEIPT', weight: 'bold', color: '#1DB446', size: 'sm' },
          { type: 'text', text: '{{shop}}', weight: 'bold', size: 'xxl', margin: 'md' },
          { type: 'text', text: 'ลูกค้า: {{name}}', size: 'xs', color: '#aaaaaa', wrap: true },
          { type: 'separator', margin: 'xxl' },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'xxl',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'Americano', size: 'sm', color: '#555555', flex: 0 },
                  { type: 'text', text: '฿65', size: 'sm', color: '#111111', align: 'end' },
                ],
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  { type: 'text', text: 'Croissant', size: 'sm', color: '#555555', flex: 0 },
                  { type: 'text', text: '฿85', size: 'sm', color: '#111111', align: 'end' },
                ],
              },
              { type: 'separator', margin: 'md' },
              {
                type: 'box',
                layout: 'horizontal',
                margin: 'md',
                contents: [
                  { type: 'text', text: 'TOTAL', size: 'sm', color: '#555555' },
                  { type: 'text', text: '฿{{total}}', size: 'sm', color: '#111111', align: 'end', weight: 'bold' },
                ],
              },
            ],
          },
          { type: 'separator', margin: 'xxl' },
          {
            type: 'box',
            layout: 'horizontal',
            margin: 'md',
            contents: [
              { type: 'text', text: 'วันที่', size: 'xs', color: '#aaaaaa', flex: 0 },
              { type: 'text', text: '{{date}}', color: '#aaaaaa', size: 'xs', align: 'end' },
            ],
          },
        ],
      },
      styles: { footer: { separator: true } },
    },
  },
  {
    id: 'ticket',
    name: 'ตั๋ว / บัตรเข้างาน',
    description: 'ตั๋วหนังพร้อมรูปโปสเตอร์และ QR-style footer',
    json: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: `${IMG}/01_3_movie.png`,
        size: 'full',
        aspectRatio: '30:10',
        aspectMode: 'cover',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          { type: 'text', text: 'BROWN\'S ADVENTURE', wrap: true, weight: 'bold', size: 'xl' },
          {
            type: 'box',
            layout: 'baseline',
            contents: [
              { type: 'icon', size: 'sm', url: 'https://api.iconify.design/lucide/star.svg?color=%23f5a623' },
              { type: 'icon', size: 'sm', url: 'https://api.iconify.design/lucide/star.svg?color=%23f5a623' },
              { type: 'icon', size: 'sm', url: 'https://api.iconify.design/lucide/star.svg?color=%23f5a623' },
              { type: 'icon', size: 'sm', url: 'https://api.iconify.design/lucide/star.svg?color=%23f5a623' },
              { type: 'icon', size: 'sm', url: 'https://api.iconify.design/lucide/star.svg?color=%23d9d9d9' },
              { type: 'text', text: '4.0', size: 'sm', color: '#8c8c8c', margin: 'md', flex: 0 },
            ],
          },
          {
            type: 'box',
            layout: 'vertical',
            margin: 'lg',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: 'Date', color: '#aaaaaa', size: 'sm', flex: 1 },
                  { type: 'text', text: 'Monday 25, 20:30', wrap: true, color: '#666666', size: 'sm', flex: 4 },
                ],
              },
              {
                type: 'box',
                layout: 'baseline',
                spacing: 'sm',
                contents: [
                  { type: 'text', text: 'Seats', color: '#aaaaaa', size: 'sm', flex: 1 },
                  { type: 'text', text: 'C Row, 18 Seat', wrap: true, color: '#666666', size: 'sm', flex: 4 },
                ],
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#905c44',
            action: { type: 'uri', label: 'ดูตั๋วของฉัน', uri: 'https://line.me/' },
          },
        ],
      },
    },
  },
  {
    id: 'product-carousel',
    name: 'สินค้า (Carousel)',
    description: 'carousel สินค้า 2 ใบพร้อมราคาและปุ่มซื้อ',
    json: {
      type: 'carousel',
      contents: [
        {
          type: 'bubble',
          hero: {
            type: 'image',
            url: `${IMG}/01_5_carousel.png`,
            size: 'full',
            aspectRatio: '20:13',
            aspectMode: 'cover',
          },
          body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              { type: 'text', text: 'Arm Chair, White', wrap: true, weight: 'bold', size: 'md' },
              {
                type: 'box',
                layout: 'baseline',
                contents: [
                  { type: 'text', text: '฿4,900', wrap: true, weight: 'bold', size: 'xl', flex: 0 },
                ],
              },
            ],
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              { type: 'button', style: 'primary', action: { type: 'uri', label: 'ซื้อเลย', uri: 'https://line.me/' } },
              { type: 'button', action: { type: 'uri', label: 'ใส่ตะกร้า', uri: 'https://line.me/' } },
            ],
          },
        },
        {
          type: 'bubble',
          hero: {
            type: 'image',
            url: `${IMG}/01_6_carousel.png`,
            size: 'full',
            aspectRatio: '20:13',
            aspectMode: 'cover',
          },
          body: {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              { type: 'text', text: 'Metal Desk Lamp', wrap: true, weight: 'bold', size: 'md' },
              {
                type: 'box',
                layout: 'baseline',
                flex: 1,
                contents: [
                  { type: 'text', text: '฿890', wrap: true, weight: 'bold', size: 'xl', flex: 0 },
                ],
              },
            ],
          },
          footer: {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              { type: 'button', style: 'primary', action: { type: 'uri', label: 'ซื้อเลย', uri: 'https://line.me/' } },
              { type: 'button', action: { type: 'uri', label: 'ใส่ตะกร้า', uri: 'https://line.me/' } },
            ],
          },
        },
      ],
    },
  },
  {
    id: 'profile',
    name: 'โปรไฟล์ / นามบัตร',
    description: 'การ์ดแนะนำตัวพร้อมช่องทางติดต่อ (bind ข้อมูลได้)',
    json: {
      type: 'bubble',
      size: 'kilo',
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        paddingAll: '20px',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            spacing: 'md',
            contents: [
              {
                type: 'image',
                url: `${IMG}/01_2_restaurant.png`,
                size: '60px',
                aspectRatio: '1:1',
                aspectMode: 'cover',
                flex: 0,
              },
              {
                type: 'box',
                layout: 'vertical',
                justifyContent: 'center',
                contents: [
                  { type: 'text', text: '{{name}}', weight: 'bold', size: 'lg', wrap: true },
                  { type: 'text', text: 'Product Designer', size: 'sm', color: '#8c8c8c' },
                ],
              },
            ],
          },
          { type: 'separator', margin: 'sm' },
          {
            type: 'box',
            layout: 'baseline',
            spacing: 'md',
            contents: [
              { type: 'icon', url: 'https://api.iconify.design/lucide/phone.svg?color=%2306c755', size: 'sm' },
              { type: 'text', text: '081-234-5678', size: 'sm', color: '#666666' },
            ],
          },
          {
            type: 'box',
            layout: 'baseline',
            spacing: 'md',
            contents: [
              { type: 'icon', url: 'https://api.iconify.design/lucide/mail.svg?color=%2306c755', size: 'sm' },
              { type: 'text', text: 'hello@example.com', size: 'sm', color: '#666666' },
            ],
          },
        ],
      },
    },
  },
  {
    id: 'promo',
    name: 'โปรโมชั่น',
    description: 'แบนเนอร์โปรโมชั่นพร้อมปุ่ม CTA',
    json: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: `${IMG}/01_4_shopping.png`,
        size: 'full',
        aspectRatio: '20:13',
        aspectMode: 'cover',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'sm',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: 'FLASH SALE', weight: 'bold', size: 'xl', color: '#eb4034', flex: 0 },
              {
                type: 'box',
                layout: 'vertical',
                backgroundColor: '#eb4034',
                cornerRadius: '4px',
                paddingAll: '4px',
                paddingStart: '8px',
                paddingEnd: '8px',
                flex: 0,
                margin: 'md',
                justifyContent: 'center',
                contents: [{ type: 'text', text: '-50%', color: '#ffffff', size: 'xs', weight: 'bold' }],
              },
            ],
          },
          { type: 'text', text: 'ลดสูงสุด 50% ทั้งร้าน เฉพาะวันนี้ - อาทิตย์นี้เท่านั้น', wrap: true, size: 'sm', color: '#666666' },
        ],
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          { type: 'button', style: 'primary', color: '#eb4034', action: { type: 'uri', label: 'ช้อปเลย 🛒', uri: 'https://line.me/' } },
        ],
      },
    },
  },
]
