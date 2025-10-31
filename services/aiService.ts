// services/aiService.ts
import { GoogleGenAI } from "@google/genai";
import { Claim } from "../types";
import { notificationService } from './notificationService';

// This function constructs a detailed prompt for the Gemini API
const create8DPrompt = (claim: Claim): string => {
    // Sanitize data to avoid issues with JSON stringify or markdown
    const fishboneSummary = claim.rootCauseAnalysis.fishboneAnalysis.categories
        .map(cat => `  - ${cat.name}: ${cat.causes.join(', ') || 'Chưa xác định'}`)
        .join('\n');
    
    const claimData = {
        id: claim.id,
        customerName: claim.customerName,
        orderId: claim.orderId,
        productCode: claim.productCode,
        defectType: claim.defectType,
        description: claim.description,
        quantity: claim.quantity,
        totalQuantity: claim.totalQuantity,
        discoveryLocation: claim.discoveryLocation,
        creatorName: claim.creator.name,
        assigneeName: claim.assignee.name,
        responsibleDepartment: claim.responsibleDepartment,
        containmentActions: claim.containmentActions || 'Chưa có hành động.',
        traceabilitySummary: claim.traceabilityAnalysis.summary || 'Chưa có tổng kết.',
        analysisMethod: claim.rootCauseAnalysis.analysisMethod || 'Chưa xác định.',
        analysisDetails: claim.rootCauseAnalysis.analysisMethod === 'Fishbone' ? fishboneSummary : claim.rootCauseAnalysis.fiveWhysAnalysis || 'Chưa có phân tích chi tiết.',
        rootCause: claim.rootCauseAnalysis.rootCause || 'Chưa xác định.',
        correctiveActions: claim.correctiveActions || 'Chưa xác định.',
        preventiveActions: claim.preventiveActions || 'Chưa xác định.',
        effectivenessValidation: claim.effectivenessValidation || 'Chưa xác định.',
        closureSummary: claim.closureSummary || 'Chưa có tóm tắt.',
        customerConfirmation: claim.customerConfirmation ? 'Đã xác nhận' : 'Chưa xác nhận',
    };

    return `
Bạn là một Trưởng phòng Quản lý Chất lượng (QC Manager) chuyên nghiệp tại YKK, một công ty sản xuất dây kéo hàng đầu thế giới. Nhiệm vụ của bạn là tạo ra một Báo cáo 8D chính thức bằng tiếng Việt dựa trên dữ liệu khiếu nại (claim) được cung cấp. Báo cáo phải có cấu trúc rõ ràng, văn phong chuyên nghiệp, và sử dụng chính xác dữ liệu đã cho. Nếu thiếu dữ liệu, hãy ghi là "Chưa xác định" hoặc "Đang điều tra".

Dữ liệu claim như sau:
${JSON.stringify(claimData, null, 2)}

Vui lòng tạo báo cáo theo định dạng Markdown với cấu trúc sau:

# Báo cáo 8D - Phân tích & Giải quyết Vấn đề - Claim: ${claimData.id}

---

## D1: Thành lập đội xử lý (Form the Team)
- **Trưởng nhóm:** ${claimData.creatorName} (QC)
- **Thành viên chính:** ${claimData.assigneeName} (${claimData.responsibleDepartment})
- **Các bộ phận liên quan:** QC, ${claimData.responsibleDepartment}, và các bộ phận khác được yêu cầu.

---

## D2: Mô tả vấn đề (Describe the Problem)
- **Khách hàng:** ${claimData.customerName}
- **Sản phẩm:** ${claimData.productCode}
- **Đơn hàng:** ${claimData.orderId}
- **Vấn đề:** ${claimData.defectType}
- **Mô tả chi tiết:** ${claimData.description}
- **Số lượng ảnh hưởng:** ${claimData.quantity} trên tổng số ${claimData.totalQuantity} (${((claimData.quantity / claimData.totalQuantity) * 100).toFixed(2)}%)
- **Nơi phát hiện:** ${claimData.discoveryLocation}

---

## D3: Hành động ngăn chặn tạm thời (Implement Containment Actions)
${claimData.containmentActions}

---

## D4: Phân tích & Xác định Nguyên nhân gốc rễ (Identify & Verify Root Cause)
- **Phương pháp phân tích:** ${claimData.analysisMethod}
- **Kết quả truy xuất nguồn gốc:** ${claimData.traceabilitySummary}
- **Phân tích chi tiết:**
${claimData.analysisDetails}
- **Nguyên nhân gốc rễ đã xác định:** ${claimData.rootCause}

---

## D5: Lựa chọn & Xác minh Hành động khắc phục (Choose & Verify Corrective Actions)
${claimData.correctiveActions}

---

## D6: Thực thi Hành động khắc phục vĩnh viễn (Implement Permanent Corrective Actions)
(AI, vui lòng diễn giải các hành động ở D5 thành kế hoạch thực thi chi tiết hơn nếu có thể)
${claimData.correctiveActions}

---

## D7: Ngăn chặn tái diễn (Prevent Recurrence)
- **Hành động phòng ngừa:** ${claimData.preventiveActions}
- **Xác nhận hiệu quả:** ${claimData.effectivenessValidation}

---

## D8: Ghi nhận & Chúc mừng đội (Congratulate the Team)
- **Tóm tắt đóng claim:** ${claimData.closureSummary}
- **Xác nhận từ khách hàng:** ${claimData.customerConfirmation}

---
*Báo cáo được tạo tự động bởi hệ thống YKK CCMS AI vào ngày ${new Date().toLocaleDateString('vi-VN')}.*
`;
};

export const aiService = {
    generate8DReport: async (claim: Claim): Promise<string> => {
        try {
            if (!process.env.API_KEY) {
                notificationService.notify("API Key for Gemini is not configured.", { type: 'error' });
                throw new Error("API Key not found.");
            }
            
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = create8DPrompt(claim);
            
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash', // Use a powerful and fast model for this task
                contents: prompt,
            });

            return response.text;

        } catch (error) {
            console.error("Error calling Gemini API:", error);
            throw new Error("Failed to generate report from AI service.");
        }
    },
};