'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'es' | 'en' | 'fr' | 'de' | 'pt' | 'zh'
type Currency = 'USD' | 'EUR' | 'MXN' | 'GBP' | 'CNY' | 'JPY'

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  currency: Currency
  setCurrency: (curr: Currency) => void
  t: (key: string) => string
  formatPrice: (amount: number) => string
}

const translations: Record<Language, Record<string, string>> = {
  es: {
    'hero.title': 'Sistema de Punto de Venta para',
    'hero.highlight': 'Impresiones Personalizadas',
    'hero.subtitle': 'Gestiona tu tienda de forma moderna y eficiente. Funciona sin conexión, multi-tienda, multi-plataforma.',
    'hero.download': 'Descargar Gratis',
    'hero.docs': 'Ver Documentación',
    'hero.creator': 'Creado por',
    'nav.features': 'Características',
    'nav.download': 'Descargar',
    'nav.docs': 'Documentación',
    'nav.central': 'Central',
    'nav.store': 'Acceder a Tienda',
    'features.title': 'Características Principales',
    'features.subtitle': 'Todo lo que necesitas para gestionar tu negocio de impresiones personalizadas',
    'feature.offline': 'Offline-First',
    'feature.offline.desc': 'Funciona sin conexión a internet. Los datos se sincronizan automáticamente cuando hay conexión.',
    'feature.multistore': 'Multi-Tienda',
    'feature.multistore.desc': 'Gestiona múltiples sucursales desde un panel central. Transferencias entre tiendas.',
    'feature.analytics': 'Analítica Avanzada',
    'feature.analytics.desc': 'Reportes detallados, gráficas en tiempo real y métricas de rendimiento para tu negocio.',
    'feature.inventory': 'Inventario Inteligente',
    'feature.inventory.desc': 'Control completo de stock, alertas de productos bajos, historial de movimientos.',
    'feature.roles': 'Roles y Permisos',
    'feature.roles.desc': '4 niveles de acceso: Cajero, Admin Sucursal, Admin Célula y Admin General.',
    'feature.audit': 'Auditoría Completa',
    'feature.audit.desc': 'Registro detallado de todas las acciones. Trazabilidad total para seguridad.',
  },
  en: {
    'hero.title': 'Point of Sale System for',
    'hero.highlight': 'Custom Printing',
    'hero.subtitle': 'Manage your store in a modern and efficient way. Works offline, multi-store, multi-platform.',
    'hero.download': 'Download Free',
    'hero.docs': 'View Documentation',
    'hero.creator': 'Created by',
    'nav.features': 'Features',
    'nav.download': 'Download',
    'nav.docs': 'Documentation',
    'nav.central': 'Central',
    'nav.store': 'Access Store',
    'features.title': 'Main Features',
    'features.subtitle': 'Everything you need to manage your custom printing business',
    'feature.offline': 'Offline-First',
    'feature.offline.desc': 'Works without internet connection. Data syncs automatically when connected.',
    'feature.multistore': 'Multi-Store',
    'feature.multistore.desc': 'Manage multiple branches from a central panel. Inter-store transfers.',
    'feature.analytics': 'Advanced Analytics',
    'feature.analytics.desc': 'Detailed reports, real-time charts and performance metrics for your business.',
    'feature.inventory': 'Smart Inventory',
    'feature.inventory.desc': 'Complete stock control, low product alerts, movement history.',
    'feature.roles': 'Roles & Permissions',
    'feature.roles.desc': '4 access levels: Cashier, Branch Admin, Cell Admin and General Admin.',
    'feature.audit': 'Complete Audit',
    'feature.audit.desc': 'Detailed record of all actions. Full traceability for security.',
  },
  fr: {
    'hero.title': 'Système de Point de Vente pour',
    'hero.highlight': 'Impressions Personnalisées',
    'hero.subtitle': 'Gérez votre magasin de manière moderne et efficace. Fonctionne hors ligne, multi-magasins.',
    'hero.download': 'Télécharger Gratuitement',
    'hero.docs': 'Voir la Documentation',
    'hero.creator': 'Créé par',
    'nav.features': 'Fonctionnalités',
    'nav.download': 'Télécharger',
    'nav.docs': 'Documentation',
    'nav.central': 'Central',
    'nav.store': 'Accéder au Magasin',
    'features.title': 'Fonctionnalités Principales',
    'features.subtitle': 'Tout ce dont vous avez besoin pour gérer votre entreprise d\'impressions personnalisées',
    'feature.offline': 'Hors Ligne d\'Abord',
    'feature.offline.desc': 'Fonctionne sans connexion Internet. Les données se synchronisent automatiquement.',
    'feature.multistore': 'Multi-Magasin',
    'feature.multistore.desc': 'Gérez plusieurs succursales depuis un panneau central. Transferts entre magasins.',
    'feature.analytics': 'Analytique Avancée',
    'feature.analytics.desc': 'Rapports détaillés, graphiques en temps réel et métriques de performance.',
    'feature.inventory': 'Inventaire Intelligent',
    'feature.inventory.desc': 'Contrôle complet du stock, alertes de produits bas, historique des mouvements.',
    'feature.roles': 'Rôles et Permissions',
    'feature.roles.desc': '4 niveaux d\'accès: Caissier, Admin Succursale, Admin Cellule et Admin Général.',
    'feature.audit': 'Audit Complet',
    'feature.audit.desc': 'Enregistrement détaillé de toutes les actions. Traçabilité totale pour la sécurité.',
  },
  de: {
    'hero.title': 'Kassensystem für',
    'hero.highlight': 'Personalisierte Drucke',
    'hero.subtitle': 'Verwalten Sie Ihr Geschäft modern und effizient. Funktioniert offline, mehrere Filialen.',
    'hero.download': 'Kostenlos Herunterladen',
    'hero.docs': 'Dokumentation Anzeigen',
    'hero.creator': 'Erstellt von',
    'nav.features': 'Funktionen',
    'nav.download': 'Herunterladen',
    'nav.docs': 'Dokumentation',
    'nav.central': 'Zentrale',
    'nav.store': 'Zum Geschäft',
    'features.title': 'Hauptfunktionen',
    'features.subtitle': 'Alles was Sie brauchen, um Ihr personalisiertes Druckgeschäft zu verwalten',
    'feature.offline': 'Offline-Zuerst',
    'feature.offline.desc': 'Funktioniert ohne Internetverbindung. Daten werden automatisch synchronisiert.',
    'feature.multistore': 'Multi-Filiale',
    'feature.multistore.desc': 'Verwalten Sie mehrere Filialen von einem zentralen Panel. Transfers zwischen Filialen.',
    'feature.analytics': 'Erweiterte Analytik',
    'feature.analytics.desc': 'Detaillierte Berichte, Echtzeit-Diagramme und Leistungskennzahlen.',
    'feature.inventory': 'Intelligentes Inventar',
    'feature.inventory.desc': 'Vollständige Bestandskontrolle, Warnungen bei niedrigen Produkten, Bewegungsverlauf.',
    'feature.roles': 'Rollen & Berechtigungen',
    'feature.roles.desc': '4 Zugriffsebenen: Kassierer, Filialadmin, Zellenadmin und Generaladmin.',
    'feature.audit': 'Vollständige Prüfung',
    'feature.audit.desc': 'Detaillierte Aufzeichnung aller Aktionen. Vollständige Rückverfolgbarkeit für Sicherheit.',
  },
  pt: {
    'hero.title': 'Sistema de Ponto de Venda para',
    'hero.highlight': 'Impressões Personalizadas',
    'hero.subtitle': 'Gerencie sua loja de forma moderna e eficiente. Funciona offline, multi-loja.',
    'hero.download': 'Baixar Grátis',
    'hero.docs': 'Ver Documentação',
    'hero.creator': 'Criado por',
    'nav.features': 'Recursos',
    'nav.download': 'Baixar',
    'nav.docs': 'Documentação',
    'nav.central': 'Central',
    'nav.store': 'Acessar Loja',
    'features.title': 'Recursos Principais',
    'features.subtitle': 'Tudo o que você precisa para gerenciar seu negócio de impressões personalizadas',
    'feature.offline': 'Offline-First',
    'feature.offline.desc': 'Funciona sem conexão à internet. Os dados sincronizam automaticamente.',
    'feature.multistore': 'Multi-Loja',
    'feature.multistore.desc': 'Gerencie várias filiais de um painel central. Transferências entre lojas.',
    'feature.analytics': 'Análise Avançada',
    'feature.analytics.desc': 'Relatórios detalhados, gráficos em tempo real e métricas de desempenho.',
    'feature.inventory': 'Inventário Inteligente',
    'feature.inventory.desc': 'Controle completo de estoque, alertas de produtos baixos, histórico de movimentos.',
    'feature.roles': 'Funções e Permissões',
    'feature.roles.desc': '4 níveis de acesso: Caixa, Admin Filial, Admin Célula e Admin Geral.',
    'feature.audit': 'Auditoria Completa',
    'feature.audit.desc': 'Registro detalhado de todas as ações. Rastreabilidade total para segurança.',
  },
  zh: {
    'hero.title': '销售点系统',
    'hero.highlight': '定制印刷',
    'hero.subtitle': '以现代高效的方式管理您的商店。离线工作，多店铺。',
    'hero.download': '免费下载',
    'hero.docs': '查看文档',
    'hero.creator': '创建者',
    'nav.features': '特点',
    'nav.download': '下载',
    'nav.docs': '文档',
    'nav.central': '中央',
    'nav.store': '访问商店',
    'features.title': '主要特点',
    'features.subtitle': '管理定制印刷业务所需的一切',
    'feature.offline': '离线优先',
    'feature.offline.desc': '无需互联网连接即可工作。数据自动同步。',
    'feature.multistore': '多店铺',
    'feature.multistore.desc': '从中央面板管理多个分支机构。店铺间转移。',
    'feature.analytics': '高级分析',
    'feature.analytics.desc': '详细报告、实时图表和业务绩效指标。',
    'feature.inventory': '智能库存',
    'feature.inventory.desc': '完整的库存控制、低产品警报、移动历史记录。',
    'feature.roles': '角色和权限',
    'feature.roles.desc': '4个访问级别：收银员、分店管理员、单元管理员和总管理员。',
    'feature.audit': '完整审计',
    'feature.audit.desc': '所有操作的详细记录。完全可追溯性以确保安全。',
  },
}

const currencySymbols: Record<Currency, { symbol: string; locale: string }> = {
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'de-DE' },
  MXN: { symbol: '$', locale: 'es-MX' },
  GBP: { symbol: '£', locale: 'en-GB' },
  CNY: { symbol: '¥', locale: 'zh-CN' },
  JPY: { symbol: '¥', locale: 'ja-JP' },
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('es')
  const [currency, setCurrency] = useState<Currency>('MXN')

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language
    const savedCurr = localStorage.getItem('currency') as Currency
    if (savedLang) setLanguage(savedLang)
    if (savedCurr) setCurrency(savedCurr)
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('language', lang)
  }

  const handleSetCurrency = (curr: Currency) => {
    setCurrency(curr)
    localStorage.setItem('currency', curr)
  }

  const t = (key: string): string => {
    return translations[language][key] || key
  }

  const formatPrice = (amount: number): string => {
    const { symbol, locale } = currencySymbols[currency]
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  return (
    <I18nContext.Provider
      value={{
        language,
        setLanguage: handleSetLanguage,
        currency,
        setCurrency: handleSetCurrency,
        t,
        formatPrice,
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}
