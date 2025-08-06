import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiService } from '../../services/api';
import './ContentMortgageEdit.css';

interface DropdownOption {
  id: string;
  order: number;
  titleRu: string;
  titleHe: string;
}

interface MortgageContentItem {
  id: string;
  content_key: string;
  component_type: string;
  category: string;
  screen_location: string;
  description: string;
  is_active: boolean;
  translations: {
    ru: string;
    he: string;
    en: string;
  };
  last_modified: string;
}

const ContentMortgageEdit: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [contentItem, setContentItem] = useState<MortgageContentItem | null>(null);
  const [dropdownOptions, setDropdownOptions] = useState<DropdownOption[]>([]);
  const [titleRu, setTitleRu] = useState('');
  const [titleHe, setTitleHe] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchContentItem();
  }, [itemId]);

  const fetchContentItem = async () => {
    try {
      setLoading(true);
      // Fetch the specific content item
      const response = await apiService.getMortgageContent();
      
      if (response.success && response.data?.mortgage_content) {
        const item = response.data.mortgage_content.find((item: any) => item.id === itemId);
        console.log('Found item:', item);
        
        if (item) {
          setContentItem(item);
          setTitleRu(item.translations?.ru || '');
          setTitleHe(item.translations?.he || '');
          
          // If it's a dropdown, fetch its options
          if (item.component_type === 'dropdown') {
            console.log('Item is a dropdown, fetching options...');
            fetchDropdownOptions(item);
          } else {
            console.log('Item component type:', item.component_type);
          }
        } else {
          setError('Content item not found');
        }
      }
    } catch (err) {
      console.error('Error fetching content:', err);
      setError('Failed to load content');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownOptions = async (item: MortgageContentItem) => {
    try {
      // For mortgage content, we need to use the item's ID to fetch options
      // The API will handle converting ID to content_key if needed
      const response = await apiService.getMortgageDropdownOptions(item.id);
      
      console.log('Fetching options for item:', item.id, 'Response:', response);
      
      if (response.success && response.data && response.data.length > 0) {
        setDropdownOptions(response.data);
      } else {
        // No options found - this dropdown might not have options yet
        setDropdownOptions([]);
      }
    } catch (err) {
      console.error('Error fetching dropdown options:', err);
      setDropdownOptions([]);
    }
  };

  const handleAddOption = () => {
    const newOption: DropdownOption = {
      id: `new-${Date.now()}`,
      order: dropdownOptions.length + 1,
      titleRu: '',
      titleHe: ''
    };
    setDropdownOptions([...dropdownOptions, newOption]);
  };

  const handleUpdateOption = (optionId: string, field: 'titleRu' | 'titleHe', value: string) => {
    setDropdownOptions(options =>
      options.map(opt =>
        opt.id === optionId ? { ...opt, [field]: value } : opt
      )
    );
  };

  const handleDeleteOption = (optionId: string) => {
    setDropdownOptions(options => {
      const filtered = options.filter(opt => opt.id !== optionId);
      // Reorder remaining options
      return filtered.map((opt, index) => ({
        ...opt,
        order: index + 1
      }));
    });
  };

  const handleMoveOption = (optionId: string, direction: 'up' | 'down') => {
    const index = dropdownOptions.findIndex(opt => opt.id === optionId);
    if (index === -1) return;

    const newOptions = [...dropdownOptions];
    if (direction === 'up' && index > 0) {
      [newOptions[index], newOptions[index - 1]] = [newOptions[index - 1], newOptions[index]];
    } else if (direction === 'down' && index < newOptions.length - 1) {
      [newOptions[index], newOptions[index + 1]] = [newOptions[index + 1], newOptions[index]];
    }

    // Update order numbers
    const reordered = newOptions.map((opt, idx) => ({
      ...opt,
      order: idx + 1
    }));
    setDropdownOptions(reordered);
  };

  const handleSave = async () => {
    try {
      console.log('Saving mortgage content...');
      
      // Prepare the update data
      const updateData = {
        id: itemId,
        translations: {
          ru: titleRu,
          he: titleHe,
          en: contentItem?.translations?.en || ''
        },
        dropdown_options: dropdownOptions
      };

      // Call the API to update the content
      const response = await apiService.updateMortgageContent(itemId!, updateData);
      
      if (response.success) {
        console.log('✅ Mortgage content saved successfully');
        // Navigate back to the same page and search state
        navigate('/content/mortgage', { 
          state: { 
            fromPage: location.state?.fromPage || 1,
            searchTerm: location.state?.searchTerm || ''
          } 
        });
      } else {
        console.error('❌ Failed to save mortgage content:', response.error);
        alert(response.error || 'Ошибка при сохранении');
      }
    } catch (err) {
      console.error('❌ Error saving:', err);
      alert('Ошибка при сохранении');
    }
  };

  const handleBack = () => {
    navigate('/content/mortgage', { 
      state: { 
        fromPage: location.state?.fromPage || 1,
        searchTerm: location.state?.searchTerm || ''
      } 
    });
  };

  if (loading) {
    return (
      <div className="mortgage-edit-container">
        <div className="loading-state">Загрузка...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mortgage-edit-container">
        <div className="error-state">{error}</div>
      </div>
    );
  }

  const isDropdown = contentItem?.component_type === 'dropdown';

  return (
    <div className="mortgage-edit-container">
        {/* Breadcrumb */}
        <div className="breadcrumb-container">
          <span className="breadcrumb-item">Контент сайта</span>
          <div className="breadcrumb-separator"></div>
          <span className="breadcrumb-item">Рассчитать ипотеку</span>
          <div className="breadcrumb-separator"></div>
          <span className="breadcrumb-item active">Редактирование</span>
        </div>

        {/* Header */}
        <div className="page-header-edit">
          <h1 className="page-title-edit">
            {contentItem?.translations?.ru || contentItem?.content_key || 'Загрузка...'}
          </h1>
          <span className="page-subtitle">Mortgage_page</span>
        </div>

        {/* Last Edit Info */}
        <div className="last-edit-info">
          <span className="last-edit-label">Последнее редактирование</span>
          <span className="last-edit-date">
            {new Date(contentItem?.last_modified || '').toLocaleDateString('ru-RU')} | {new Date(contentItem?.last_modified || '').toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Title Section */}
        <h2 className="section-title" style={{ marginBottom: '16px', marginLeft: '105px' }}>Заголовки действий</h2>
        <div className="section-container">
          
          <div className="input-group">
            <label className="input-label">RU</label>
            <input
              type="text"
              className="text-input"
              value={titleRu}
              onChange={(e) => setTitleRu(e.target.value)}
              placeholder="Введите заголовок на русском"
            />
          </div>

          <div className="input-group">
            <label className="input-label">HEB</label>
            <input
              type="text"
              className="text-input rtl"
              value={titleHe}
              onChange={(e) => setTitleHe(e.target.value)}
              placeholder="הזן כותרת בעברית"
              dir="rtl"
            />
          </div>
        </div>

        {/* Dropdown Options Section (only for dropdown type) */}
        {isDropdown && (
          <>
            <h2 className="section-title" style={{ marginBottom: '32px', marginLeft: '105px' }}>Дополнительный текст</h2>
            <div className="section-container">
              <div className="section-header">
                <button className="add-option-btn" onClick={handleAddOption}>
                  <span className="add-icon">+</span>
                  <span>Добавить вариант</span>
                </button>
              </div>

            <div className="options-list">
              {dropdownOptions.length === 0 ? (
                <div className="no-options-message" style={{
                  padding: '40px',
                  textAlign: 'center',
                  color: '#9CA3AF',
                  backgroundColor: 'rgba(55, 65, 81, 0.3)',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <p style={{ margin: 0, fontSize: '16px' }}>Для этого поля пока нет вариантов ответов</p>
                  <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>Нажмите "Добавить вариант" чтобы создать первый вариант</p>
                </div>
              ) : (
                dropdownOptions.map((option, index) => (
                  <div key={option.id} className="option-row">
                    <div className="option-number">{option.order}</div>
                    
                    <div className="option-inputs">
                      <div className="option-input-group">
                        <label className="input-label">RU</label>
                        <input
                          type="text"
                          className="option-input"
                          value={option.titleRu}
                          onChange={(e) => handleUpdateOption(option.id, 'titleRu', e.target.value)}
                          placeholder="Вариант на русском"
                        />
                      </div>
                      
                      <div className="option-input-group">
                        <label className="input-label">HEB</label>
                        <input
                          type="text"
                          className="option-input rtl"
                          value={option.titleHe}
                          onChange={(e) => handleUpdateOption(option.id, 'titleHe', e.target.value)}
                          placeholder="אפשרות בעברית"
                          dir="rtl"
                        />
                      </div>
                    </div>

                    <div className="option-actions">
                      <button 
                        className="option-action-btn"
                        onClick={() => handleMoveOption(option.id, 'up')}
                        disabled={index === 0}
                        title="Переместить вверх"
                      >
                        ↑
                      </button>
                      <button 
                        className="option-action-btn"
                        onClick={() => handleMoveOption(option.id, 'down')}
                        disabled={index === dropdownOptions.length - 1}
                        title="Переместить вниз"
                      >
                        ↓
                      </button>
                      <button 
                        className="option-action-btn delete"
                        onClick={() => handleDeleteOption(option.id)}
                        title="Удалить"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <div className="action-buttons-row">
            <div className="box3" style={{ width: '225px', height: '41px' }}></div>
            <div className="action-buttons-inner">
              <button className="btn-secondary" onClick={handleBack}>
                Назад
              </button>
              <button className="btn-primary" onClick={handleSave}>
                Сохранить и опубликовать
              </button>
            </div>
          </div>
        </div>
    </div>
  );
};

export default ContentMortgageEdit;