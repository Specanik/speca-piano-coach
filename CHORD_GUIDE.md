# 🎹 Piano - Chord Learning Edition

Ứng dụng piano web với tính năng học hợp âm toàn diện, bao gồm tra cứu nhanh, biến thể hợp âm, nghe thử và hiển thị trực quan.

## ✨ Các Tính Năng Mới

### 1. 🔍 Tìm Kiếm Hợp Âm
- **Search Bar**: Thanh tìm kiếm nhanh ở đầu trang
- **Gợi Ý Tức Thời**: Khi nhấp vào ô tìm kiếm, hiển thị tất cả hợp âm sẵn có
- **Lọc Thông Minh**: Gõ tên hợp âm (C, Am, G7, Cmaj7...) để lọc kết quả

**Cách Sử Dụng:**
```
1. Nhấp vào ô tìm kiếm
2. Gõ tên hợp âm (ví dụ: Am, C7, Gmaj7)
3. Nhấp vào kết quả để xem chi tiết
```

### 2. 📚 Modal Chi Tiết Hợp Âm
Khi chọn một hợp âm, modal sẽ hiển thị:

#### 🎯 **Thông Tin Cơ Bản**
- Tên hợp âm và các tên gọi khác
- Mô tả chi tiết về âm thanh
- Các cách bấm cơ bản

#### 📊 **Biến Thể Hợp Âm**
Mỗi hợp âm có 3 mức độ khó:
- **Cơ Bản** (🎯): Biến thể đơn giản nhất
  - Root Position, 1st Inversion, 2nd Inversion
- **Trung Cấp** (📊): Thêm các nốt mở rộng
  - maj7, maj9, 7, sus4, v.v.
- **Nâng Cao** (🚀): Voicing phức tạp
  - Ext11, Ext13, Altered chords

#### 🎼 **Chi Tiết Mỗi Biến Thể**
```
┌─────────────────────────┐
│ C Major (Root Position) │ ← Tên biến thể
│ Cơ bản                  │ ← Mức độ khó
│ ┌───────────────────┐   │
│ │ C4  E4  G4        │   │ ← Các nốt MIDI
│ └───────────────────┘   │
│ ▶ Nghe Thử              │ ← Nút phát âm thanh
└─────────────────────────┘
```

### 3. 🔊 Nghe Thử & Hiển Thị Trực Quan

#### **Phát Âm Thanh**
- Nhấp nút "▶ Nghe Thử" trên bất kỳ biến thể nào
- Nút sẽ chuyển sang "⏸ Đang phát..." cho đến khi kết thúc
- Âm thanh được tạo sinh thực tế bằng Web Audio API

#### **Keyboard Highlighting**
- **Khi phát âm thanh**: Các phím trong hợp âm sẽ sáng lên
  - Phím trắng: Sáng vàng (gold)
  - Phím đen: Sáng cam (orange)
- **Hiệu ứng Visual**: Tất cả các phím được bôi sáng cùng lúc

### 4. 🎹 Bàn Phím Ảo (Virtual Keyboard)

#### **Các Tương Tác**
- **Chuột**: Nhấp hoặc kéo trên phím để chơi
- **Bàn Phím**: Dùng các phím tắt
  - Octave 4: Z, S, X, D, C, V, G, B, H, N, J, M
  - Octave 5: Q, 2, W, 3, E, R, 5, T, 6, Y, 7, U
- **Cảm Ứng**: Hỗ trợ đầy đủ trên thiết bị mobile

#### **Trình Chiếu Trực Quan (Visualizer)**
- Canvas ở trên bàn phím hiển thị sóng âm thanh real-time
- Thể hiện từng nốt được phát

## 🎨 Giao Diện & Chủ Đề

### **4 Chủ Đề Có Sẵn**
1. **Classic** (Mặc định): Giao diện cổ điển, sang trọng
2. **Grand**: Giao diện violin grand piano, ấm áp
3. **Neon**: Giao diện hiện đại, neon sáng
4. **Minimal**: Giao diện tối giản, sạch sẽ

Mỗi chủ đề có màu sắc riêng cho:
- Tìm kiếm & modal
- Chữ và nhãn
- Phím piano

## 📋 Các Hợp Âm Sẵn Có

| Hợp Âm | Tên | Tên Gọi Khác |
|--------|------|----------|
| C | C Major | Cmaj |
| Cm | C Minor | Cmin |
| C7 | C Dominant 7 | Cdom7 |
| Csus | C Suspended | Csus4 |
| G | G Major | Gmaj |
| D | D Major | Dmaj |
| Am | A Minor | Amin |

**Mở Rộng**: Dễ dàng thêm nhiều hợp âm khác trong `js/chords.js`

## 🛠️ Cách Sử Dụng - Tutorial Đầy Đủ

### **Để Tìm Kiếm Một Hợp Âm**
1. Nhấp vào ô tìm kiếm ở trên cùng
2. Gõ tên hợp âm (ví dụ: `Am` hoặc `Gmaj7`)
3. Nhấp vào kết quả để xem chi tiết

### **Để Nghe Một Biến Thể**
1. Tìm kiếm hợp âm (ví dụ: Am)
2. Modal sẽ mở ra tự động
3. Cuộn xuống để tìm mức độ khó mong muốn
4. Nhấp nút "▶ Nghe Thử" bên cạnh biến thể
5. Các phím trên bàn phím sẽ sáng lên khi phát

### **Để Chơi Thủ Công**
1. Đóng modal (nhấp ✕ hoặc bên ngoài modal)
2. Nhấp trực tiếp trên phím piano hoặc dùng bàn phím
3. Dùng các nút điều khiển ở trên để thay đổi theme hoặc số phím

## 💡 Mẹo & Kỹ Thuật

### **Học Hợp Âm Hiệu Quả**
1. Nghe từng biến thể cơ bản
2. Tập bấm theo các nốt được gợi ý
3. Dần dần thử những biến thể trung cấp và nâng cao
4. Tập kết hợp các hợp âm trong các bản nhạc

### **Sử Dụng Voicing**
- **Voicing đóng** (Close voicing): Các nốt gần nhau, âm thanh rõ ràng
- **Voicing mở** (Open voicing): Các nốt cách xa, âm thanh rộng
- **Thay thế nốt**: Dùng các nốt khác nhau để tạo màu sắc mới

### **Kết Hợp Hợp Âm**
Hãy thử các tiến hành hợp âm phổ biến:
- C → Am → F → G (Pop)
- Am → E → Am → E (Blues)
- C → F → C → G (Classical)

## 🔧 Phát Triển - Thêm Hợp Âm Mới

### **Cấu Trúc Hợp Âm trong `chords.js`**
```javascript
'ChordName': {
    name: 'Display Name',
    root: 0,  // MIDI note offset (0=C)
    aliases: ['Alias1', 'Alias2'],
    variations: {
        basic: [
            { name: 'Variation Name', notes: [0,4,7], midi: [60,64,67], difficulty: 'Cơ bản' }
        ],
        intermediate: [ /* ... */ ],
        advanced: [ /* ... */ ]
    },
    description: 'Mô tả hợp âm...',
    voicings: ['Cách 1', 'Cách 2', 'Cách 3']
}
```

### **Cách Thêm Hợp Âm Mới**
1. Mở `js/chords.js`
2. Tìm object `CHORDS_DATA`
3. Thêm hợp âm mới theo cấu trúc trên
4. Lưu tệp - hợp âm sẽ xuất hiện ngay lập tức

**Ví Dụ: Thêm Gmaj7**
```javascript
'Gmaj7': {
    name: 'G Major 7',
    root: 7,  // G là 7 bán độ từ C
    aliases: ['Gmaj7', 'GM7'],
    variations: {
        basic: [
            { name: 'Gmaj7 (Root)', notes: [7,11,2,6], 
              midi: [67,71,74,78], difficulty: 'Cơ bản' }
        ],
        intermediate: [],
        advanced: []
    },
    description: 'Hợp âm trưởng 7 G...',
    voicings: ['G-B-D-F#', 'B-D-F#-G', 'D-F#-G-B']
}
```

## 📞 Hỗ Trợ

- Tất cả tính năng được thử nghiệm trên Chrome, Firefox, Safari, Edge
- Hỗ trợ đầy đủ thiết bị mobile
- Nếu có vấn đề, kiểm tra console (F12) để xem thông báo lỗi

## 📝 Lưu Ý

- Âm thanh sử dụng Web Audio API - yêu cầu trình duyệt hiện đại
- Các preferences (theme, số phím) được lưu cục bộ (localStorage)
- Không cần kết nối internet - ứng dụng hoạt động offline

---

**Chúc bạn học piano vui vẻ! 🎵**
