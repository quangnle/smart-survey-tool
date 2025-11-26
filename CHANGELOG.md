# Changelog

## [Unreleased] - Multiple Choice với Link Rules

### ✨ Tính năng mới

#### Multiple Choice Questions
- **Toggle Multiple Choice**: Thêm checkbox để bật/tắt chế độ "Cho phép chọn nhiều câu trả lời"
- **Priority cho Answers**: Mỗi câu trả lời có thể set priority (số càng cao = ưu tiên càng cao)
- **Link Rules**: Hệ thống luật liên kết phức tạp cho multiple choice

#### Link Rules System
- **Tạo Rules**: Người dùng có thể tạo các rules với điều kiện là tổ hợp các câu trả lời
- **UI Rules**: 
  - Dropdown để chọn câu trả lời
  - Nút [+] để thêm câu trả lời vào rule
  - Nút [×] để xóa câu trả lời khỏi rule
  - Nút 🔗 để link rule đến câu hỏi khác
  - Nút ↑↓ để sắp xếp thứ tự rules
- **Logic xử lý**:
  1. Kiểm tra Rules theo thứ tự (exact match)
  2. Nếu không match → dùng link của câu trả lời có priority cao nhất
  3. Nếu không có link → dùng nextQuestion mặc định
  4. Nếu không chọn gì hoặc không match → end survey

#### Survey Preview
- **Checkboxes**: Multiple choice questions hiển thị checkboxes thay vì radio buttons
- **Submit Button**: Nút "Tiếp tục" để submit multiple selections
- **Logic Processing**: Tự động xử lý rules → priority → nextQuestion khi submit

### 🔧 Thay đổi kỹ thuật

#### Models
- `Node`: Thêm `isMultipleChoice: boolean` và `rules: Array`
- `Answer`: Thêm `priority: number` (default: 0)
- `Rule`: Structure `{answerIndices: number[], linkedTo: string, order: number}`

#### Services
- **rule-service.js**: Service mới để quản lý rules
  - `toggleMultipleChoice()`
  - `addRule()`, `deleteRule()`
  - `addAnswerToRule()`, `removeAnswerFromRule()`
  - `updateRuleLink()`
  - `moveRuleUp()`, `moveRuleDown()`
- **answer-service.js**: Thêm `updateAnswerPriority()`
- **link-service.js**: Thêm `openRuleLinkModal()` để link rules

#### UI Components
- **question-editor.js**: 
  - Thêm toggle multiple choice checkbox
  - Thêm section "Luật liên kết (Link Rules)"
  - Function `renderRulesList()` để render rules UI
- **answer-list.js**: 
  - Thêm priority input (chỉ hiển thị khi multiple choice)
- **survey-runner.js**:
  - Function `processMultipleChoiceSelection()` để xử lý logic
  - Function `arraysMatchExactly()` để check exact match
  - Function `submitMultipleChoice()` để submit multiple selections
  - Update `showSurveyQuestion()` để render checkboxes cho multiple choice

#### File I/O
- **Export/Import**: Hỗ trợ export/import `isMultipleChoice`, `rules`, và `priority`

### 📝 Logic chi tiết

#### Rule Matching
- **Exact Match**: Rule chỉ match khi user chọn đúng các câu trả lời trong rule (không thừa, không thiếu)
- **AND Logic**: Tất cả câu trả lời trong rule phải được chọn
- **Order Matters**: Rules được check theo thứ tự từ trên xuống, rule đầu tiên match sẽ được dùng

#### Priority Fallback
- Khi không có rule match, hệ thống sẽ tìm câu trả lời có priority cao nhất trong số các câu đã chọn
- Nếu câu trả lời đó có link → dùng link đó
- Nếu không có link → dùng nextQuestion mặc định

#### Toggle Behavior
- Khi chuyển từ multiple → single: Rules sẽ bị xóa
- Khi chuyển từ single → multiple: Rules section sẽ hiện ra

### 🐛 Bug Fixes
- (Không có bug fixes trong update này)

### 📚 Documentation
- Thêm CHANGELOG.md để track các thay đổi

---

## Previous Versions
- Initial release với single choice questions và basic linking

