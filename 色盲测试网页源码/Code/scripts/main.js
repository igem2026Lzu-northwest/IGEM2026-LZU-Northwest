let currentImage = null;
const originalImgElement = document.getElementById('original-image');
const filteredImgElement = document.getElementById('filtered-image');
const placeholderText = document.getElementById('placeholder-text');
const filterPlaceholder = document.getElementById('filter-placeholder');
const riskText = document.getElementById('risk-text');
const presetList = document.getElementById('preset-list');
let hideTimeout;

// 预设图片 - 使用本地图片路径（请确保图片已放入images文件夹）
const PRESET_IMAGE_BASE64 = {
    '折线图': 'images/折线图.jpg',
    '应力云图': 'images/三位应力云图.jpg',
    '化学显色': 'images/pH试纸显色.jpg',
    '热力图': 'images/热力图.jpg',
    '柱状图': 'images/柱状图.png'
};

/** 上传图片 */
function handleUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => loadImage(event.target.result);
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

/** 显示预设列表 */
function showPresetList() {
    clearTimeout(hideTimeout);
    if (presetList) presetList.classList.add('show');
}

function hidePresetListDelay() {
    hideTimeout = setTimeout(() => {
        if (presetList) presetList.classList.remove('show');
    }, 300);
}

function cancelHide() {
    clearTimeout(hideTimeout);
}

/** 加载预设图片 */
function loadPresetImage(name) {
    if (presetList) presetList.classList.remove('show');
    const imgPath = PRESET_IMAGE_BASE64[name];
    if (imgPath) loadImage(imgPath);
    else alert('预设图片不存在');
}

/** 分析色盲友好性风险 */
function analyzeColorBlindnessRisk(img) {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    let redGreenPixels = 0;
    let redPixels = 0;
    let blueYellowPixels = 0;
    let totalPixels = data.length / 4;
    
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        if ((r > 100 && g < 80 && Math.abs(r - g) > 50) || 
            (g > 100 && r < 80 && Math.abs(g - r) > 50)) {
            redGreenPixels++;
        }
        
        if (r > 150 && g < 100 && b < 100) {
            redPixels++;
        }
        
        if ((b > 100 && r < 80 && g < 80) || 
            (r > 100 && g > 100 && b < 80 && Math.abs(r - g) < 50)) {
            blueYellowPixels++;
        }
    }
    
    const redGreenRatio = redGreenPixels / totalPixels;
    const redRatio = redPixels / totalPixels;
    const blueYellowRatio = blueYellowPixels / totalPixels;
    
    let brightnessSum = 0;
    for (let i = 0; i < data.length; i += 4) {
        const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        brightnessSum += brightness;
    }
    const avgBrightness = brightnessSum / totalPixels;
    
    if (redGreenRatio > 0.3 || redRatio > 0.25 || blueYellowRatio > 0.2) {
        return {
            level: 'high',
            message: '检测到高风险：图像中存在大量红绿色或单一颜色区域，可能对色盲用户造成识别困难。建议使用颜色+形状/纹理的组合来区分信息。',
            color: '#721c24'
        };
    } else if (redGreenRatio > 0.15 || redRatio > 0.15 || blueYellowRatio > 0.1) {
        return {
            level: 'medium',
            message: '检测到中等风险：图像中存在一定比例的颜色区域可能影响色盲用户的识别。建议增加对比度或使用辅助标识。',
            color: '#856404'
        };
    } else if (redGreenRatio > 0.05 || redRatio > 0.08 || blueYellowRatio > 0.05) {
        return {
            level: 'low',
            message: '检测到潜在风险：图像中少量颜色区域可能对部分色盲用户造成轻微影响。建议预览不同色盲模拟效果确认可读性。',
            color: '#0c5460'
        };
    } else {
        return {
            level: 'none',
            message: '未检测到明显风险：当前图像在色盲友好性方面表现良好。',
            color: '#155724'
        };
    }
}

/** 加载图片并显示 */
function loadImage(src) {
    const img = new Image();
    img.onload = () => {
        currentImage = img;
        originalImgElement.src = src;
        originalImgElement.style.display = 'block';
        placeholderText.style.display = 'none';

        filteredImgElement.style.display = 'none';
        filterPlaceholder.style.display = 'block';
        filterPlaceholder.textContent = '请点击下方按钮模拟色盲效果';

        const riskAnalysis = analyzeColorBlindnessRisk(img);
        riskText.textContent = riskAnalysis.message;
        riskText.style.color = riskAnalysis.color;
    };
    img.onerror = () => {
        console.error('图片加载失败:', src);
        alert('图片加载失败，请检查图片路径是否正确');
    };
    img.src = src;
}

/** 模拟色弱效果 */
function applyFilter(type) {
    if (!currentImage) {
        alert('请先上传图片或选择预设图片！');
        return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = currentImage.naturalWidth;
    canvas.height = currentImage.naturalHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(currentImage, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    const matrices = {
        'red-green-blind': [
            [0.378, 0.622, 0.000],
            [0.378, 0.622, 0.000],
            [0.000, 0.154, 0.846]
        ],
        'red-weak': [
            [0.620, 0.380, 0.000],
            [0.259, 0.741, 0.000],
            [0.000, 0.141, 0.859]
        ],
        'blue-yellow-weak': [
            [0.950, 0.050, 0.000],
            [0.000, 0.433, 0.567],
            [0.000, 0.475, 0.525]
        ]
    };

    const matrix = matrices[type];
    
    if (matrix) {
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i] / 255.0;
            const g = data[i + 1] / 255.0;
            const b = data[i + 2] / 255.0;
            
            const newR = Math.max(0, Math.min(1, 
                matrix[0][0] * r + matrix[0][1] * g + matrix[0][2] * b
            ));
            const newG = Math.max(0, Math.min(1, 
                matrix[1][0] * r + matrix[1][1] * g + matrix[1][2] * b
            ));
            const newB = Math.max(0, Math.min(1, 
                matrix[2][0] * r + matrix[2][1] * g + matrix[2][2] * b
            ));
            
            data[i] = Math.round(newR * 255);
            data[i + 1] = Math.round(newG * 255);
            data[i + 2] = Math.round(newB * 255);
        }
    }

    ctx.putImageData(imageData, 0, 0);
    filteredImgElement.src = canvas.toDataURL('image/png');
    filteredImgElement.style.display = 'block';
    filterPlaceholder.style.display = 'none';
    updateRiskWarning(type);
}

/** 更新风险提示 */
function updateRiskWarning(type) {
    let warningMsg = '', color = '#856404';
    switch (type) {
        case 'red-green-blind':
            warningMsg = '正在模拟红绿色盲效果，请注意观察图像可读性。';
            color = '#721c24';
            break;
        case 'red-weak':
            warningMsg = '正在模拟红色弱效果，请注意观察图像可读性。';
            color = '#856404';
            break;
        case 'blue-yellow-weak':
            warningMsg = '正在模拟蓝黄色弱效果，请注意观察图像可读性。';
            color = '#0c5460';
            break;
        default: 
            warningMsg = '请选择色盲类型进行模拟检测';
            color = '#856404';
    }
    riskText.textContent = warningMsg;
    riskText.style.color = color;
}

// ==================== 反馈功能 ====================
// 后端API地址（已部署到 Render）
const FEEDBACK_API_URL = 'https://feedback-api-pd22.onrender.com/api/feedback';

function feedback() {
    const modal = document.createElement('div');
    modal.id = 'feedbackModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10000;
    `;

    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 16px;
            padding: 30px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        ">
            <h2 style="margin: 0 0 20px 0; color: #333; text-align: center;">用户反馈</h2>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">
                    您的专业 <span style="color: #e74c3c;">*</span>
                </label>
                <input type="text" id="feedbackMajor" placeholder="例如：大气科学、计算机科学" style="
                    width: 100%;
                    padding: 10px;
                    border: 2px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 14px;
                ">
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">
                    您的需求 <span style="color: #e74c3c;">*</span>
                </label>
                <textarea id="feedbackRequirement" placeholder="请描述您的需求..." style="
                    width: 100%;
                    padding: 10px;
                    border: 2px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 14px;
                    min-height: 80px;
                    resize: vertical;
                "></textarea>
            </div>

            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; font-weight: 600; color: #333;">
                    更改建议 <span style="color: #e74c3c;">*</span>
                </label>
                <textarea id="feedbackSuggestion" placeholder="请提出您的改进建议..." style="
                    width: 100%;
                    padding: 10px;
                    border: 2px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 14px;
                    min-height: 80px;
                    resize: vertical;
                "></textarea>
            </div>

            <div style="display: flex; gap: 10px;">
                <button id="cancelFeedback" style="
                    flex: 1;
                    padding: 12px;
                    background: #f5f5f5;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                ">取消</button>
                <button id="submitFeedback" style="
                    flex: 1;
                    padding: 12px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                ">提交</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });

    document.getElementById('cancelFeedback').addEventListener('click', function() {
        document.body.removeChild(modal);
    });

    document.getElementById('submitFeedback').addEventListener('click', async function() {
        const major = document.getElementById('feedbackMajor').value.trim();
        const requirement = document.getElementById('feedbackRequirement').value.trim();
        const suggestion = document.getElementById('feedbackSuggestion').value.trim();

        if (!major || !requirement || !suggestion) {
            alert('请填写所有必填字段！');
            return;
        }

        const submitBtn = this;
        submitBtn.disabled = true;
        submitBtn.textContent = '提交中...';

        try {
            const response = await fetch(FEEDBACK_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ major, requirement, suggestion })
            });

            const result = await response.json();

            if (result.success) {
                alert('感谢您的反馈！');
                document.body.removeChild(modal);
            } else {
                alert('提交失败：' + result.message);
            }
        } catch (error) {
            console.error('提交反馈失败:', error);
            alert('提交失败，请稍后重试！\n\n错误: ' + error.message);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '提交';
        }
    });
}

// 页面加载时渲染预设图片缩略图
document.addEventListener("DOMContentLoaded", function() {
    const presetImgs = document.querySelectorAll('#preset-list img');
    presetImgs.forEach(img => {
        const name = img.getAttribute('alt');
        const imgPath = PRESET_IMAGE_BASE64[name];
        if (imgPath) {
            img.src = imgPath;
        } else {
            console.warn('预设图片不存在:', name);
        }
    });
});