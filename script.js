// 全局变量
let drinkRecords = [];
let currentRecordId = null;
let recordToDelete = null;

// DOM 加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 初始化应用
    initApp();
    
    // 绑定导航事件
    bindNavigationEvents();
    
    // 绑定记录表单事件
    bindRecordFormEvents();
    
    // 绑定统计页面事件
    bindStatsEvents();
    
    // 绑定数据管理事件
    bindDataManagementEvents();
    
    // 绑定确认删除事件
    bindConfirmDeleteEvents();
    
    // 绑定备份提示事件
    bindBackupReminderEvents();
});

// 初始化应用
function initApp() {
    // 从本地存储加载数据
    loadDataFromLocalStorage();

    // 初始化年份选择器
    initYearSelector();

    // 设置当前年月为默认筛选条件
    setCurrentYearMonth();

    // 检查是否需要显示备份提示
    checkBackupReminder();

    // 更新上次备份时间显示
    updateLastBackupTime();

    // 初始化月份选择器
    const yearSelect = document.getElementById('year-select');
    if (yearSelect.value) {
        initMonthSelector(parseInt(yearSelect.value));
    }
}

// 从本地存储加载数据
function loadDataFromLocalStorage() {
    const storedRecords = localStorage.getItem('drinkRecords');
    if (storedRecords) {
        drinkRecords = JSON.parse(storedRecords);
    }
    
    // 按时间戳降序排序（最新的记录在前）
    drinkRecords.sort((a, b) => b.timestamp - a.timestamp);
}

// 保存数据到本地存储
function saveDataToLocalStorage() {
    localStorage.setItem('drinkRecords', JSON.stringify(drinkRecords));
    
    // 更新记录列表
    updateRecordsTable();
    
    // 更新统计数据
    updateStats();
}

// 初始化年份选择器
function initYearSelector() {
    const yearSelect = document.getElementById('year-select');
    
    // 从记录中提取有数据的年份
    const yearsWithData = getYearsWithData();
    
    // 如果没有数据，添加当前年份
    if (yearsWithData.length === 0) {
        const currentYear = new Date().getFullYear();
        yearsWithData.push(currentYear);
    }
    
    // 清空现有选项
    yearSelect.innerHTML = '';
    
    // 生成年份选项
    yearsWithData.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year + '年';
        yearSelect.appendChild(option);
    });
}

// 获取有数据的年份
function getYearsWithData() {
    const years = new Set();

    drinkRecords.forEach(record => {
        const recordDate = new Date(record.timestamp);
        years.add(recordDate.getFullYear());
    });

    // 转换为数组并降序排序
    return Array.from(years).sort((a, b) => b - a);
}

// 获取指定年份有数据的月份
function getMonthsWithData(year) {
    const months = new Set();

    drinkRecords.forEach(record => {
        const recordDate = new Date(record.timestamp);
        if (recordDate.getFullYear() === year) {
            months.add(recordDate.getMonth() + 1); // 月份从1开始
        }
    });

    // 转换为数组并升序排序
    return Array.from(months).sort((a, b) => a - b);
}

// 初始化月份选择器
function initMonthSelector(year) {
    const monthSelect = document.getElementById('month-select');

    // 从记录中提取指定年份有数据的月份
    const monthsWithData = getMonthsWithData(year);

    // 如果没有数据，添加当前月份
    if (monthsWithData.length === 0) {
        const currentMonth = new Date().getMonth() + 1;
        monthsWithData.push(currentMonth);
    }

    // 清空现有选项
    monthSelect.innerHTML = '';

    // 生成月份选项
    monthsWithData.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month + '月';
        monthSelect.appendChild(option);
    });
}

// 设置当前年月为默认筛选条件
function setCurrentYearMonth() {
    const currentDate = new Date();
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');

    // 获取有数据的年份
    const yearsWithData = getYearsWithData();
    
    // 如果有数据，选择最新的年份
    if (yearsWithData.length > 0) {
        yearSelect.value = yearsWithData[0];

        // 根据选择的年份初始化月份选择器
        initMonthSelector(parseInt(yearSelect.value));

        // 获取选择年份有数据的月份
        const monthsWithData = getMonthsWithData(parseInt(yearSelect.value));

        // 如果有数据，选择最新的月份
        if (monthsWithData.length > 0) {
            monthSelect.value = monthsWithData[monthsWithData.length - 1];
        }
    } else {
        // 如果没有数据，使用当前年月
        yearSelect.value = currentDate.getFullYear();
        monthSelect.value = currentDate.getMonth() + 1;
    }
}

// 绑定导航事件
function bindNavigationEvents() {
    const navItems = document.querySelectorAll('.nav-item');
    const pageContents = document.querySelectorAll('.page-content');
    
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 移除所有导航项的激活状态
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // 添加当前导航项的激活状态
            this.classList.add('active');
            
            // 获取目标页面ID
            const targetId = this.getAttribute('data-target');
            
            // 隐藏所有页面
            pageContents.forEach(page => {
                page.classList.remove('active');
                page.classList.add('hidden');
            });
            
            // 显示目标页面
            const targetPage = document.getElementById(targetId);
            targetPage.classList.remove('hidden');
            targetPage.classList.add('active');
            
            // 如果切换到统计页面，更新统计数据
            if (targetId === 'stats-page') {
                updateStats();
            }
            
            // 如果切换到数据页面，更新记录列表
            if (targetId === 'data-page') {
                updateRecordsTable();
            }
        });
    });
}

// 绑定记录表单事件
function bindRecordFormEvents() {
    const addRecordBtn = document.getElementById('add-record-btn');
    const recordModal = document.getElementById('record-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const recordForm = document.getElementById('record-form');
    const drinkTypeBtns = document.querySelectorAll('.type-tag');
    const drinkTypeInput = document.getElementById('drink-type');
    const drinkBrandBtns = document.querySelectorAll('.brand-tag');
    const drinkBrandInput = document.getElementById('drink-brand');
    
    // 绑定饮品类型标签点击事件
    drinkTypeBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除所有标签的激活状态
            drinkTypeBtns.forEach(b => b.classList.remove('active'));
            
            // 添加当前标签的激活状态
            this.classList.add('active');
            
            // 更新隐藏输入字段的值
            drinkTypeInput.value = this.getAttribute('data-value');
        });
    });
    
    // 绑定品牌标签点击事件
    drinkBrandBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除所有标签的激活状态
            drinkBrandBtns.forEach(b => b.classList.remove('active'));
            
            // 添加当前标签的激活状态
            this.classList.add('active');
            
            // 更新隐藏输入字段的值
            drinkBrandInput.value = this.getAttribute('data-value');
            
            // 处理自定义品牌输入框
            handleCustomBrandInput(this.getAttribute('data-value'));
        });
    });
    
    // 绑定温度标签点击事件
    const drinkTemperatureBtns = document.querySelectorAll('.temperature-tag');
    const drinkTemperatureInput = document.getElementById('drink-temperature');
    drinkTemperatureBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除所有标签的激活状态
            drinkTemperatureBtns.forEach(b => b.classList.remove('active'));
            
            // 添加当前标签的激活状态
            this.classList.add('active');
            
            // 更新隐藏输入字段的值
            drinkTemperatureInput.value = this.getAttribute('data-value');
        });
    });
    
    // 绑定甜度标签点击事件
    const drinkSweetnessBtns = document.querySelectorAll('.sweetness-tag');
    const drinkSweetnessInput = document.getElementById('drink-sweetness');
    drinkSweetnessBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除所有标签的激活状态
            drinkSweetnessBtns.forEach(b => b.classList.remove('active'));
            
            // 添加当前标签的激活状态
            this.classList.add('active');
            
            // 更新隐藏输入字段的值
            drinkSweetnessInput.value = this.getAttribute('data-value');
        });
    });
    
    // 处理自定义品牌输入框的显示和隐藏
    function handleCustomBrandInput(brandValue) {
        // 先隐藏已存在的自定义输入框
        const existingInput = document.getElementById('custom-brand-input');
        if (existingInput) {
            existingInput.style.display = 'none';
        } 
        // 如果选择了"其它"，显示或创建自定义输入框
        if (brandValue === '其它') {
            let customInput = existingInput;
            if (!customInput) {
                // 创建新的输入框
                customInput = document.createElement('input');
                customInput.type = 'text';
                customInput.id = 'custom-brand-input';
                customInput.className = 'custom-brand-input form-input';
                customInput.placeholder = '请输入品牌名称';
                // 添加输入事件监听
                customInput.addEventListener('input', function() {
                    drinkBrandInput.value = this.value.trim() || '其它';
                });
                // 将输入框插入到品牌容器内部的末尾
                const brandContainer = document.getElementById('drink-brand-container');
                brandContainer.appendChild(customInput);
            }
            // 显示输入框并聚焦
            customInput.style.display = 'block';
            customInput.focus();
        }
    }
    
    // 点击添加记录按钮
    addRecordBtn.addEventListener('click', function() {
        // 重置表单
        resetRecordForm();
        
        // 显示弹窗
        recordModal.classList.remove('hidden');
        recordModal.classList.add('visible');
        
        // 设置标题
        document.getElementById('modal-title').textContent = '添加饮品记录';
    });
    
    // 点击关闭按钮
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            recordModal.classList.remove('visible');
            recordModal.classList.add('hidden');
            
            // 延迟后完全隐藏弹窗
            setTimeout(() => {
                recordModal.classList.add('hidden');
            }, 300);
        });
    });
    
    // 提交表单
    recordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // 获取表单数据
        const type = document.getElementById('drink-type').value;
        const brand = document.getElementById('drink-brand').value;
        
        // 验证必填字段
        if (!type) {
            alert('请选择饮品类型');
            return;
        }
        
        if (!brand) {
            alert('请选择饮品品牌');
            return;
        }
        
        const formData = {
            type: type,
            brand: brand,
            name: document.getElementById('drink-name').value || '',
            temperature: document.getElementById('drink-temperature').value || '',
            sweetness: document.getElementById('drink-sweetness').value || '',
            calories: document.getElementById('drink-calories').value ? parseInt(document.getElementById('drink-calories').value) : null,
            price: document.getElementById('drink-price').value ? parseFloat(document.getElementById('drink-price').value) : null
        };
        
        // 如果是编辑模式，更新现有记录
        if (currentRecordId) {
            updateRecord(currentRecordId, formData);
        } else {
            // 否则添加新记录
            addRecord(formData);
        }
        
        // 关闭弹窗
        recordModal.classList.remove('visible');
        recordModal.classList.add('hidden');
        
        // 延迟后完全隐藏弹窗
        setTimeout(() => {
            recordModal.classList.add('hidden');
        }, 300);
    });
}

// 重置记录表单
function resetRecordForm() {
    document.getElementById('record-form').reset();
    document.getElementById('record-id').value = '';
    currentRecordId = null;
    
    // 重置饮品类型标签
    const drinkTypeBtns = document.querySelectorAll('.type-tag');
    drinkTypeBtns.forEach(btn => btn.classList.remove('active'));
    document.getElementById('drink-type').value = '';
    
    // 重置品牌标签
    const drinkBrandBtns = document.querySelectorAll('.brand-tag');
    drinkBrandBtns.forEach(btn => btn.classList.remove('active'));
    document.getElementById('drink-brand').value = '';
    
    // 重置温度标签
    const temperatureBtns = document.querySelectorAll('.temperature-tag');
    temperatureBtns.forEach(btn => btn.classList.remove('active'));
    document.getElementById('drink-temperature').value = '';
    
    // 重置甜度标签
    const sweetnessBtns = document.querySelectorAll('.sweetness-tag');
    sweetnessBtns.forEach(btn => btn.classList.remove('active'));
    document.getElementById('drink-sweetness').value = '';
    
    // 隐藏自定义品牌输入框（如果存在）
    const customBrandInput = document.getElementById('custom-brand-input');
    if (customBrandInput) {
        customBrandInput.classList.add('hidden');
        customBrandInput.value = '';
    }
}

// 添加记录
function addRecord(recordData) {
    const newRecord = {
        id: generateId(),
        timestamp: Date.now(),
        ...recordData
    };
    
    drinkRecords.unshift(newRecord);
    saveDataToLocalStorage();
}

// 更新记录
function updateRecord(id, recordData) {
    const index = drinkRecords.findIndex(record => record.id === id);
    if (index !== -1) {
        drinkRecords[index] = {
            ...drinkRecords[index],
            ...recordData
        };
        saveDataToLocalStorage();
    }
}

// 删除记录
function deleteRecord(id) {
    const index = drinkRecords.findIndex(record => record.id === id);
    if (index !== -1) {
        drinkRecords.splice(index, 1);
        saveDataToLocalStorage();
    }
}

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 绑定统计页面事件
function bindStatsEvents() {
    const filterBtn = document.getElementById('filter-btn');
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');
    
    // 当前排序状态（固定为降序）
    let currentSortBy = 'count';
    const currentSortOrder = 'desc';
    
    filterBtn.addEventListener('click', function() {
        updateStats();
    });
    
    // 当年份选择变化时，更新月份选择器
    yearSelect.addEventListener('change', function() {
        const selectedYear = parseInt(this.value);
        initMonthSelector(selectedYear);
        updateStats();
    });
    
    // 当月份选择变化时，更新统计
    monthSelect.addEventListener('change', function() {
        updateStats();
    });
    
    // 绑定排序事件（固定降序）
    document.querySelectorAll('.sortable').forEach(header => {
        header.addEventListener('click', function() {
            const sortBy = this.getAttribute('data-sort');
            
            // 切换排序字段，始终使用降序
            if (sortBy !== currentSortBy) {
                currentSortBy = sortBy;
                
                // 更新排行榜
                updateBrandRanking(currentSortBy, currentSortOrder);
            }
        });
    });
}

// 更新统计数据
function updateStats() {
    updateOverview();
    
    // 获取当前排序字段，始终使用降序
    const currentSortHeader = document.querySelector('.sortable i.fa-sort-desc, .sortable i.fa-sort-asc');
    if (currentSortHeader) {
        const sortBy = currentSortHeader.parentElement.getAttribute('data-sort');
        updateBrandRanking(sortBy, 'desc');
    } else {
        updateBrandRanking('count', 'desc');
    }
}

// 更新总览数据
function updateOverview() {
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');
    const selectedYear = parseInt(yearSelect.value);
    const selectedMonth = parseInt(monthSelect.value);

    // 筛选指定年月的记录
    const filteredRecords = drinkRecords.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate.getFullYear() === selectedYear && 
               recordDate.getMonth() + 1 === selectedMonth;
    });

    // 计算总览数据
    const totalCount = filteredRecords.length;
    const totalCalories = filteredRecords.reduce((sum, record) => sum + (record.calories || 0), 0);
    const totalPrice = filteredRecords.reduce((sum, record) => sum + (record.price || 0), 0);

    // 更新UI
    document.getElementById('total-count').textContent = totalCount;
    document.getElementById('total-calories').textContent = totalCalories;
    document.getElementById('total-price').textContent = totalPrice.toFixed(2);
}

// 更新品牌排行榜
function updateBrandRanking(sortBy = 'count', sortOrder = 'desc') {
    const yearSelect = document.getElementById('year-select');
    const monthSelect = document.getElementById('month-select');
    const brandRankingBody = document.getElementById('brand-ranking-body');
    
    const selectedYear = parseInt(yearSelect.value);
    const selectedMonth = parseInt(monthSelect.value);
    
    // 筛选指定年月的记录
    const filteredRecords = drinkRecords.filter(record => {
        const recordDate = new Date(record.timestamp);
        return recordDate.getFullYear() === selectedYear && 
               recordDate.getMonth() + 1 === selectedMonth;
    });
    
    // 按品牌统计数据
    const brandStats = {};
    filteredRecords.forEach(record => {
        const brand = record.brand;
        if (!brandStats[brand]) {
            brandStats[brand] = {
                count: 0,
                totalCalories: 0,
                totalPrice: 0
            };
        }
        brandStats[brand].count += 1;
        brandStats[brand].totalCalories += (record.calories || 0);
        brandStats[brand].totalPrice += (record.price || 0);
    });
    
    // 转换为数组并排序
    const brandRanking = Object.entries(brandStats)
        .map(([brand, stats]) => ({ 
            brand, 
            count: stats.count,
            totalCalories: stats.totalCalories,
            totalPrice: stats.totalPrice
        }))
        .sort((a, b) => {
            let aValue, bValue;
            switch (sortBy) {
                case 'count':
                    aValue = a.count;
                    bValue = b.count;
                    break;
                case 'calories':
                    aValue = a.totalCalories;
                    bValue = b.totalCalories;
                    break;
                case 'price':
                    aValue = a.totalPrice;
                    bValue = b.totalPrice;
                    break;
                default:
                    aValue = a.count;
                    bValue = b.count;
            }
            return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
        });
    
    // 清空表格
    brandRankingBody.innerHTML = '';
    
    // 如果没有数据，显示空状态
    if (brandRanking.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td colspan="5" class="empty-cell">暂无数据</td>`;
        brandRankingBody.appendChild(emptyRow);
        return;
    }
    
    // 生成排行榜
    brandRanking.forEach((item, index) => {
        const row = document.createElement('tr');
        row.className = index < 3 ? `rank-${index + 1}` : '';
        row.innerHTML = `
            <td class="py-3 px-4 border-b border-gray-200">${index + 1}</td>
            <td class="py-3 px-4 border-b border-gray-200">${item.brand}</td>
            <td class="py-3 px-4 border-b border-gray-200">${item.count}</td>
            <td class="py-3 px-4 border-b border-gray-200">${item.totalCalories}</td>
            <td class="py-3 px-4 border-b border-gray-200">${item.totalPrice.toFixed(2)}</td>
        `;
        brandRankingBody.appendChild(row);
    });
    
    // 更新排序图标
    updateSortIcons(sortBy);
}

// 更新排序图标（固定降序）
function updateSortIcons(activeSort) {
    // 重置所有排序图标
    document.querySelectorAll('.sortable i').forEach(icon => {
        icon.className = 'fa fa-sort';
    });
    
    // 设置当前排序的图标（始终显示降序图标）
    const activeHeader = document.querySelector(`[data-sort="${activeSort}"] i`);
    if (activeHeader) {
        activeHeader.className = 'fa fa-sort-desc';
    }
}

// 绑定数据管理事件
function bindDataManagementEvents() {
    const exportBtn = document.getElementById('export-btn');
    const importFile = document.getElementById('import-file');
    const clearDataBtn = document.getElementById('clear-data-btn');
    
    // 文件选择事件
    importFile.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                try {
                    const importedData = JSON.parse(event.target.result);
                    if (Array.isArray(importedData)) {
                        // 合并导入的数据
                        drinkRecords = [...drinkRecords, ...importedData];
                        
                        // 去重
                        const uniqueRecords = [];
                        const ids = new Set();
                        
                        drinkRecords.forEach(record => {
                            if (!ids.has(record.id)) {
                                ids.add(record.id);
                                uniqueRecords.push(record);
                            }
                        });
                        
                        drinkRecords = uniqueRecords;
                        
                        // 按时间戳降序排序
                        drinkRecords.sort((a, b) => b.timestamp - a.timestamp);
                        
                        // 保存到本地存储
                        saveDataToLocalStorage();
                        
                        // 更新记录列表
                        updateRecordsTable();
                    } else {
                        console.error('无效的数据格式');
                    }
                } catch (error) {
                    console.error('解析文件时出错:', error);
                }
            };
            reader.readAsText(file);
        }
        
        // 重置文件输入
        importFile.value = '';
    });
    
    // 导出按钮点击事件
    exportBtn.addEventListener('click', function() {
        exportData();
    });
    
    // 清空按钮点击事件
    clearDataBtn.addEventListener('click', function() {
        if (confirm('确定要清空所有数据吗？此操作无法撤销！')) {
            localStorage.removeItem('drinkRecords');
            alert('数据已清空！');
            location.reload();
        }
    });
}

// 导出数据
function exportData() {
    if (drinkRecords.length === 0) {
        console.log('没有数据可导出');
        return;
    }
    
    const dataStr = JSON.stringify(drinkRecords, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `drink-records-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    // 更新最后备份时间
    updateLastBackupTime(true);
}

// 更新记录列表
function updateRecordsTable() {
    const recordsTableBody = document.getElementById('records-table-body');
    
    // 清空表格
    recordsTableBody.innerHTML = '';
    
    // 如果没有记录，显示空状态
    if (drinkRecords.length === 0) {
        const emptyRow = document.createElement('tr');
        emptyRow.innerHTML = `<td colspan="7" class="empty-cell">暂无记录</td>`;
        recordsTableBody.appendChild(emptyRow);
        return;
    }
    
    // 生成记录列表
    drinkRecords.forEach(record => {
        const date = new Date(record.timestamp).toLocaleDateString('zh-CN');
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="py-3 px-4 border-b border-gray-200">${date}</td>
            <td class="py-3 px-4 border-b border-gray-200">${record.type}</td>
            <td class="py-3 px-4 border-b border-gray-200">${record.brand}</td>
            <td class="py-3 px-4 border-b border-gray-200">${record.name || '-'}</td>
            <td class="py-3 px-4 border-b border-gray-200">${record.temperature || '-'}</td>
            <td class="py-3 px-4 border-b border-gray-200">${record.sweetness || '-'}</td>
            <td class="py-3 px-4 border-b border-gray-200">${record.calories !== null ? record.calories : '-'}</td>
            <td class="py-3 px-4 border-b border-gray-200">${record.price !== null ? record.price.toFixed(2) : '-'}</td>
            <td class="py-3 px-4 border-b border-gray-200">
                <button class="edit-btn" data-id="${record.id}">
                    <i class="fa fa-pencil"></i>
                </button>
                <button class="delete-btn" data-id="${record.id}">
                    <i class="fa fa-trash"></i>
                </button>
            </td>
        `;
        
        recordsTableBody.appendChild(row);
    });
    
    // 绑定编辑和删除按钮事件
    bindEditDeleteEvents();
}

// 绑定编辑和删除按钮事件
function bindEditDeleteEvents() {
    const editBtns = document.querySelectorAll('.edit-btn');
    const deleteBtns = document.querySelectorAll('.delete-btn');
    const recordModal = document.getElementById('record-modal');
    const confirmModal = document.getElementById('confirm-modal');
    
    // 编辑按钮点击事件
    editBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const recordId = this.getAttribute('data-id');
            editRecord(recordId);
        });
    });
    
    // 删除按钮点击事件
    deleteBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const recordId = this.getAttribute('data-id');
            recordToDelete = recordId;
            confirmModal.classList.remove('hidden');
            confirmModal.classList.add('visible');
        });
    });
}

// 编辑记录
function editRecord(id) {
    const record = drinkRecords.find(record => record.id === id);
    if (!record) return;
    
    // 填充表单
    document.getElementById('record-id').value = record.id;
    document.getElementById('drink-name').value = record.name || '';
    document.getElementById('drink-temperature').value = record.temperature || '';
    document.getElementById('drink-sweetness').value = record.sweetness || '';
    document.getElementById('drink-calories').value = record.calories || '';
    document.getElementById('drink-price').value = record.price || '';
    
    // 设置饮品类型标签
    const drinkTypeBtns = document.querySelectorAll('.type-tag');
    const drinkTypeInput = document.getElementById('drink-type');
    
    drinkTypeBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-value') === record.type) {
            btn.classList.add('active');
            drinkTypeInput.value = record.type;
        }
    });
    
    // 设置品牌标签
    const drinkBrandBtns = document.querySelectorAll('.brand-tag');
    const drinkBrandInput = document.getElementById('drink-brand');
    let brandFound = false;
    
    drinkBrandBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-value') === record.brand) {
            btn.classList.add('active');
            drinkBrandInput.value = record.brand;
            brandFound = true;
        }
    });
    
    // 如果品牌不在预设列表中，选择"其它"并显示自定义输入框
    if (!brandFound) {
        // 选择"其它"标签
        drinkBrandBtns.forEach(btn => {
            if (btn.getAttribute('data-value') === '其它') {
                btn.classList.add('active');
            }
        });
        
        // 设置品牌值
        drinkBrandInput.value = record.brand;
        
        // 设置温度标签
        const temperatureTags = document.querySelectorAll('.temperature-tag');
        temperatureTags.forEach(tag => {
            tag.classList.remove('active');
            if (tag.getAttribute('data-value') === record.temperature) {
                tag.classList.add('active');
            }
        });
        
        // 设置甜度标签
        const sweetnessTags = document.querySelectorAll('.sweetness-tag');
        sweetnessTags.forEach(tag => {
            tag.classList.remove('active');
            if (tag.getAttribute('data-value') === record.sweetness) {
                tag.classList.add('active');
            }
        });
        
        // 检查是否已存在自定义输入框
        let customBrandInput = document.getElementById('custom-brand-input');
        if (!customBrandInput) {
            customBrandInput = document.createElement('input');
            customBrandInput.type = 'text';
            customBrandInput.id = 'custom-brand-input';
            customBrandInput.className = 'mt-2 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500';
            customBrandInput.placeholder = '请输入品牌名称';
            
            // 添加输入事件监听
            customBrandInput.addEventListener('input', function() {
                drinkBrandInput.value = this.value || '其它';
            });
            
            // 将输入框插入到品牌容器后面
            const brandContainer = document.getElementById('drink-brand-container');
            brandContainer.parentNode.insertBefore(customBrandInput, brandContainer.nextSibling);
        }
        
        // 显示输入框并设置值
        customBrandInput.classList.remove('hidden');
        customBrandInput.value = record.brand;
    } else {
        // 隐藏自定义输入框（如果存在）
        const customBrandInput = document.getElementById('custom-brand-input');
        if (customBrandInput) {
            customBrandInput.classList.add('hidden');
            customBrandInput.value = '';
        }
    }
    
    // 设置当前编辑的记录ID
    currentRecordId = id;
    
    // 设置标题
    document.getElementById('modal-title').textContent = '编辑饮品记录';
    
    // 显示弹窗
    const recordModal = document.getElementById('record-modal');
    recordModal.classList.remove('hidden');
    recordModal.classList.add('visible');
}

// 绑定确认删除事件
function bindConfirmDeleteEvents() {
    const confirmModal = document.getElementById('confirm-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    
    // 取消删除
    cancelDeleteBtn.addEventListener('click', function() {
        confirmModal.classList.remove('visible');
        confirmModal.classList.add('hidden');
        
        // 延迟后完全隐藏弹窗
        setTimeout(() => {
            confirmModal.classList.add('hidden');
        }, 300);
        
        recordToDelete = null;
    });
    
    // 确认删除
    confirmDeleteBtn.addEventListener('click', function() {
        if (recordToDelete) {
            deleteRecord(recordToDelete);
            recordToDelete = null;
        }
        
        confirmModal.classList.remove('visible');
        confirmModal.classList.add('hidden');
        
        // 延迟后完全隐藏弹窗
        setTimeout(() => {
            confirmModal.classList.add('hidden');
        }, 300);
    });
}

// 绑定备份提示事件
function bindBackupReminderEvents() {
    const backupModal = document.getElementById('backup-modal');
    const remindLaterBtn = document.getElementById('remind-later');
    const backupNowBtn = document.getElementById('backup-now');
    
    // 稍后提醒
    remindLaterBtn.addEventListener('click', function() {
        // 设置稍后提醒的时间（7天后）
        const nextReminder = Date.now() + 7 * 24 * 60 * 60 * 1000;
        localStorage.setItem('nextBackupReminder', nextReminder);
        
        // 隐藏弹窗
        backupModal.classList.remove('visible');
        backupModal.classList.add('hidden');
        
        // 延迟后完全隐藏弹窗
        setTimeout(() => {
            backupModal.classList.add('hidden');
        }, 300);
    });
    
    // 立即备份
    backupNowBtn.addEventListener('click', function() {
        // 隐藏弹窗
        backupModal.classList.remove('visible');
        backupModal.classList.add('hidden');
        
        // 延迟后完全隐藏弹窗并导出数据
        setTimeout(() => {
            backupModal.classList.add('hidden');
            exportData();
        }, 300);
    });
}

// 检查是否需要显示备份提示
function checkBackupReminder() {
    const backupModal = document.getElementById('backup-modal');
    const lastBackup = localStorage.getItem('lastBackupTime');
    const nextReminder = localStorage.getItem('nextBackupReminder');
    const currentDate = new Date();
    
    // 如果是每月1号，或者距离上次备份超过30天，或者超过了提醒时间
    if (
        currentDate.getDate() === 1 || 
        (!lastBackup && !nextReminder) ||
        (lastBackup && (currentDate - new Date(lastBackup)) > 30 * 24 * 60 * 60 * 1000) ||
        (nextReminder && currentDate > new Date(parseInt(nextReminder)))
    ) {
        // 显示备份提示
        backupModal.classList.remove('hidden');
        backupModal.classList.add('visible');
    }
}

// 更新上次备份时间
function updateLastBackupTime(isBackup = false) {
    const lastBackupTimeElement = document.getElementById('last-backup-time');
    
    if (isBackup) {
        const currentTime = new Date().toLocaleString('zh-CN');
        localStorage.setItem('lastBackupTime', currentTime);
        lastBackupTimeElement.textContent = currentTime;
    } else {
        const lastBackup = localStorage.getItem('lastBackupTime');
        lastBackupTimeElement.textContent = lastBackup || '暂无备份记录';
    }
}
