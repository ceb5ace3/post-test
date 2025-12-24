import { useState } from 'react';
import { Header } from '@/components/pos/Header';
import { TabNavigation, TabType } from '@/components/pos/TabNavigation';
import { MenuTab } from '@/components/pos/MenuTab';
import { StockTab } from '@/components/pos/StockTab';
import { ReportsTab } from '@/components/pos/ReportsTab';
import { SettingsTab } from '@/components/pos/SettingsTab';
import { Helmet } from 'react-helmet-async';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('menu');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'menu':
        return <MenuTab searchQuery={searchQuery} />;
      case 'stock':
        return <StockTab searchQuery={searchQuery} />;
      case 'reports':
        return <ReportsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <MenuTab searchQuery={searchQuery} />;
    }
  };

  return (
    <>
      <Helmet>
        <title>Newsiri Trade Center - POS System</title>
        <meta name="description" content="Point of Sale system for Newsiri Trade Center - Manage billing, stock, and reports efficiently" />
      </Helmet>
      
      <div className="flex flex-col h-screen bg-background">
        <Header 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        
        <TabNavigation 
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <main className="flex-1 overflow-hidden">
          {renderTabContent()}
        </main>
      </div>
    </>
  );
};

export default Index;
