# seis-mfe-ofertador-facturas

sequenceDiagram
  participant FE as Frontend
  participant BFF
  participant BD

  FE->>BFF: GET /marketplace/facturas?scope=preferidos&limit=20
  BFF->>BD: SELECT ... JOIN relaciones WHERE financiera_id=X LIMIT 20
  BD-->>BFF: 20 registros
  BFF-->>FE: { data, nextCursor }

  FE->>BFF: WS join:marketplace:preferidos { financieraId }
  Note over BFF: BFF carga lista de rutDeudor preferidos en memoria (Redis/cache)

  BD-->>BFF: factura.publicada (rutDeudor=AAA)
  BFF->>BFF: ¿AAA está en lista preferidos de esta financiera?
  alt Sí
    BFF-->>FE: WS marketplace:preferidos { event: 'factura.publicada', factura: {...} }
  else No
    BFF-->>FE: WS marketplace:nuevos { event: 'factura.nueva.externa', facturaId, razonSocial, monto }
  end