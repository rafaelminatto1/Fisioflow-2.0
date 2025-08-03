import React, { useState, useCallback } from 'react';
import { MoreHorizontal, Maximize2, Minimize2, RefreshCw, X, Settings } from 'lucide-react';
import { DashboardWidget, WidgetSize } from '../../../types/enhancedDashboard';

interface BaseWidgetProps {
  widget: DashboardWidget;
  children: React.ReactNode;
  onRefresh?: () => Promise<void>;
  onResize?: (size: WidgetSize) => void;
  onRemove?: () => void;
  onSettings?: () => void;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  headerActions?: React.ReactNode;
  allowCollapse?: boolean;
  allowResize?: boolean;
  allowRemove?: boolean;
  showSettings?: boolean;
}

const BaseWidget: React.FC<BaseWidgetProps> = ({
  widget,
  children,
  onRefresh,
  onResize,
  onRemove,
  onSettings,
  isLoading = false,
  error = null,
  className = '',
  headerActions,
  allowCollapse = true,
  allowResize = false,
  allowRemove = false,
  showSettings = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(widget.isCollapsed);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (onRefresh && !isRefreshing) {
      try {
        setIsRefreshing(true);
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [onRefresh, isRefreshing]);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(!isCollapsed);
  }, [isCollapsed]);

  const handleMenuAction = useCallback((action: string) => {
    setShowMenu(false);
    switch (action) {
      case 'refresh':
        handleRefresh();
        break;
      case 'settings':
        onSettings?.();
        break;
      case 'remove':
        onRemove?.();
        break;
      case 'collapse':
        toggleCollapse();
        break;
    }
  }, [handleRefresh, onSettings, onRemove, toggleCollapse]);

  const widgetClasses = `
    bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200
    ${isCollapsed ? 'h-auto' : ''}
    ${error ? 'border-red-200 bg-red-50' : ''}
    ${className}
  `;

  const headerClasses = `
    flex items-center justify-between p-4 border-b border-gray-100
    ${isCollapsed ? 'border-b-0' : ''}
  `;

  return (
    <div className={widgetClasses} data-widget-id={widget.id}>
      {/* Widget Header */}
      <div className={headerClasses}>
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">
            {widget.title}
          </h3>
          {widget.lastUpdated && (
            <span className="text-xs text-gray-500">
              {new Date(widget.lastUpdated).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {headerActions}
          
          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              title="Atualizar"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}

          {/* Collapse Button */}
          {allowCollapse && (
            <button
              onClick={toggleCollapse}
              className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
              title={isCollapsed ? 'Expandir' : 'Recolher'}
            >
              {isCollapsed ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Menu Button */}
          {(showSettings || allowRemove || allowResize) && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                title="Mais opções"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-32">
                  {showSettings && (
                    <button
                      onClick={() => handleMenuAction('settings')}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Configurações
                    </button>
                  )}
                  {allowRemove && (
                    <button
                      onClick={() => handleMenuAction('remove')}
                      className="w-full px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Remover
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Widget Content */}
      {!isCollapsed && (
        <div className="p-4">
          {error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-2">
                <X className="w-8 h-8 mx-auto" />
              </div>
              <p className="text-red-700 font-medium">Erro ao carregar dados</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              {onRefresh && (
                <button
                  onClick={handleRefresh}
                  className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                >
                  Tentar novamente
                </button>
              )}
            </div>
          ) : isLoading ? (
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          ) : (
            children
          )}
        </div>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowMenu(false)}
        />
      )}
    </div>
  );
};

export default BaseWidget;