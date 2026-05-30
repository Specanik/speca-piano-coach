/**
 * LessonsData — 10 bài học dành cho người mới bắt đầu.
 *
 * Mỗi bài học có 4 BƯỚC (steps) theo đúng mô hình sư phạm:
 *   1. theory   — đọc lý thuyết, xem hình minh họa
 *   2. practice — luyện ngón (nhấn từng nốt theo hướng dẫn)
 *   3. play     — ghép nhạc (nhấn chord/melody theo nhịp)
 *   4. quiz     — đánh giá (trắc nghiệm hoặc chơi lại để chấm điểm)
 *
 * Cấu trúc bài học:
 * {
 *   id:          string           — "lesson-01"
 *   title:       string           — "Làm quen với phím đàn"
 *   description: string           — mô tả ngắn
 *   thumbnail:   string           — emoji đại diện
 *   xp:          number           — điểm kinh nghiệm khi hoàn thành
 *   steps:       Step[]
 * }
 *
 * Step:
 * {
 *   type:        'theory' | 'practice' | 'play' | 'quiz'
 *   title:       string
 *   content:     string            — HTML/text nội dung lý thuyết
 *   notes?:      number[]          — MIDI notes cần nhấn (practice/play)
 *   chordKey?:   string            — key trong ChordsDB (play/quiz)
 *   sequence?:   SequenceStep[]    — danh sách nốt/chord theo thứ tự
 *   question?:   QuizQuestion      — câu hỏi trắc nghiệm
 *   bpm?:        number            — nhịp độ cho bước play
 * }
 */
const LessonsData = (() => {

    // ── MIDI note constants ────────────────────────────────────────────────
    const C4=60, D4=62, E4=64, F4=65, G4=67, A4=69, B4=71, C5=72;
    const Cs4=61, Ds4=63, Fs4=66, Gs4=68, As4=70;
    // Octave 3
    const C3=48, D3=50, E3=52, F3=53, G3=55, A3=57, B3=59;

    const LESSONS = [
        // ──────────────────────────────────────────────────────────────────
        {
            id: 'lesson-01',
            title: 'Làm quen với bàn phím Piano',
            description: 'Nhận biết phím trắng, phím đen, vị trí nốt C, và cách đặt tay đúng tư thế.',
            thumbnail: '🎹',
            xp: 50,
            steps: [
                {
                    type: 'theory',
                    title: 'Cấu tạo bàn phím',
                    content: `
                        <h3>Phím trắng & phím đen</h3>
                        <p>Bàn phím piano gồm <strong>phím trắng</strong> (tự nhiên) và <strong>phím đen</strong> (thăng/giảm).
                        Phím đen luôn xếp thành nhóm 2 và nhóm 3.</p>
                        <h3>Nốt C — Điểm neo quan trọng nhất</h3>
                        <p>Nốt <strong>C</strong> luôn nằm ngay bên trái nhóm 2 phím đen.
                        Đây là phím đầu tiên bạn cần nhớ!</p>
                        <h3>Tư thế tay</h3>
                        <ul>
                            <li>Cổ tay ngang, thả lỏng</li>
                            <li>Các ngón cong tự nhiên như cầm quả táo</li>
                            <li>Ngón 1 (cái) = C, ngón 2 = D, ngón 3 = E, ngón 4 = F, ngón 5 = G</li>
                        </ul>
                    `
                },
                {
                    type: 'practice',
                    title: 'Nhấn nốt C4',
                    content: 'Tìm nốt C4 (nốt C gần giữa bàn phím). Nhấn và giữ 1 giây.',
                    notes: [C4],
                    hint: 'Nốt C4 nằm bên trái nhóm 2 phím đen ở giữa bàn phím.'
                },
                {
                    type: 'play',
                    title: 'Chạy gam 5 nốt đầu',
                    content: 'Nhấn lần lượt 5 nốt: C – D – E – F – G (không vội, từng nốt một).',
                    sequence: [
                        { midi: C4, label: 'C', durationMs: 600 },
                        { midi: D4, label: 'D', durationMs: 600 },
                        { midi: E4, label: 'E', durationMs: 600 },
                        { midi: F4, label: 'F', durationMs: 600 },
                        { midi: G4, label: 'G', durationMs: 600 },
                    ],
                    bpm: 60
                },
                {
                    type: 'quiz',
                    title: 'Câu hỏi kiểm tra',
                    question: {
                        text: 'Nốt C4 nằm ở đâu trên bàn phím?',
                        options: [
                            'Bên trái nhóm 2 phím đen',
                            'Bên phải nhóm 3 phím đen',
                            'Giữa nhóm 2 phím đen',
                            'Phím đen đầu tiên từ trái'
                        ],
                        correct: 0
                    }
                }
            ]
        },

        // ──────────────────────────────────────────────────────────────────
        {
            id: 'lesson-02',
            title: 'Gam Đô trưởng (C Major Scale)',
            description: 'Học 8 nốt gam C trưởng — nền tảng của mọi bài nhạc.',
            thumbnail: '🎵',
            xp: 60,
            steps: [
                {
                    type: 'theory',
                    title: 'Gam là gì?',
                    content: `
                        <h3>Gam (Scale)</h3>
                        <p>Gam là một chuỗi nốt nhạc sắp xếp theo thứ tự từ thấp đến cao (hoặc ngược lại).
                        Gam C trưởng gồm 8 nốt: <strong>C – D – E – F – G – A – B – C</strong>.</p>
                        <h3>Công thức khoảng cách</h3>
                        <p>Gam trưởng luôn theo mẫu: <strong>T – T – ST – T – T – T – ST</strong>
                        (T = tone = 2 phím, ST = semitone = 1 phím).</p>
                        <h3>Gam C trưởng đặc biệt</h3>
                        <p>Toàn bộ nốt đều là phím trắng — dễ học nhất để bắt đầu!</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Nhận biết 8 nốt',
                    content: 'Nhấn lần lượt từng nốt được tô sáng (theo thứ tự từ trái sang phải).',
                    notes: [C4, D4, E4, F4, G4, A4, B4, C5],
                    hint: 'Tất cả đều là phím trắng, không có phím đen nào!'
                },
                {
                    type: 'play',
                    title: 'Chạy gam lên đầy đủ',
                    content: 'Chơi gam C trưởng từ C4 lên C5 theo nhịp điều độ.',
                    sequence: [
                        { midi: C4, label: 'C', durationMs: 500 },
                        { midi: D4, label: 'D', durationMs: 500 },
                        { midi: E4, label: 'E', durationMs: 500 },
                        { midi: F4, label: 'F', durationMs: 500 },
                        { midi: G4, label: 'G', durationMs: 500 },
                        { midi: A4, label: 'A', durationMs: 500 },
                        { midi: B4, label: 'B', durationMs: 500 },
                        { midi: C5, label: 'C5', durationMs: 700 },
                    ],
                    bpm: 72
                },
                {
                    type: 'quiz',
                    title: 'Kiểm tra: Thứ tự gam',
                    question: {
                        text: 'Nốt thứ 5 trong gam C trưởng là gì?',
                        options: ['E', 'F', 'G', 'A'],
                        correct: 2
                    }
                }
            ]
        },

        // ──────────────────────────────────────────────────────────────────
        {
            id: 'lesson-03',
            title: 'Hợp âm C trưởng (C Major Chord)',
            description: 'Hợp âm đầu tiên: C – E – G nhấn cùng lúc.',
            thumbnail: '🎼',
            xp: 75,
            steps: [
                {
                    type: 'theory',
                    title: 'Hợp âm là gì?',
                    content: `
                        <h3>Hợp âm (Chord)</h3>
                        <p>Hợp âm là từ 2 nốt trở lên được nhấn <strong>cùng lúc</strong>.
                        Hợp âm C trưởng gồm 3 nốt: <strong>C – E – G</strong>.</p>
                        <h3>Công thức hợp âm trưởng</h3>
                        <p>Bậc 1 – Bậc 3 – Bậc 5 trong gam, hay cách tính nhanh:
                        <strong>nốt gốc + 4 phím + 3 phím</strong>.</p>
                        <h3>Cảm xúc</h3>
                        <p>Hợp âm trưởng nghe <em>sáng, vui, tươi</em>.</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Luyện nhấn C Major',
                    content: 'Nhấn đồng thời 3 nốt C – E – G (ngón 1, 3, 5 tay phải).',
                    notes: [C4, E4, G4],
                    hint: 'Ngón cái (1) = C, ngón giữa (3) = E, ngón út (5) = G.'
                },
                {
                    type: 'play',
                    title: 'Nhấn chord theo nhịp',
                    content: 'Nhấn hợp âm C major 4 lần liên tiếp, đều nhịp.',
                    sequence: [
                        { midi: [C4, E4, G4], label: 'C',  durationMs: 700 },
                        { midi: [C4, E4, G4], label: 'C',  durationMs: 700 },
                        { midi: [C4, E4, G4], label: 'C',  durationMs: 700 },
                        { midi: [C4, E4, G4], label: 'C',  durationMs: 700 },
                    ],
                    bpm: 60
                },
                {
                    type: 'quiz',
                    title: 'Kiểm tra hợp âm C',
                    question: {
                        text: 'Hợp âm C trưởng gồm những nốt nào?',
                        options: ['C – D – E', 'C – E – G', 'C – F – G', 'C – E – A'],
                        correct: 1
                    }
                }
            ]
        },

        // ──────────────────────────────────────────────────────────────────
        {
            id: 'lesson-04',
            title: 'Hợp âm G trưởng (G Major Chord)',
            description: 'Hợp âm thứ hai: G – B – D. Cặp đôi C + G rất phổ biến.',
            thumbnail: '🎸',
            xp: 80,
            steps: [
                {
                    type: 'theory',
                    title: 'G Major',
                    content: `
                        <h3>Hợp âm G trưởng</h3>
                        <p>Gồm 3 nốt: <strong>G – B – D</strong>. Cảm xúc: <em>sáng, năng lượng, tự tin</em>.</p>
                        <h3>Cặp C – G</h3>
                        <p>Đây là cặp hợp âm phổ biến nhất trong nhạc pop: <strong>C → G → Am → F</strong>.
                        Cả trăm bài hát dùng vòng này!</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Luyện nhấn G Major',
                    content: 'Nhấn đồng thời G3 – B3 – D4 (tay trái) hoặc G4 – B4 – D5 (tay phải).',
                    notes: [G3, B3, D4],
                    hint: 'G3 = nốt G phía dưới C4. Đếm: G + 4 phím = B + 3 phím = D.'
                },
                {
                    type: 'play',
                    title: 'Chuyển giữa C và G',
                    content: 'Chuyển luân phiên giữa C major và G major theo nhịp.',
                    sequence: [
                        { midi: [C4, E4, G4], label: 'C',  durationMs: 700 },
                        { midi: [C4, E4, G4], label: 'C',  durationMs: 700 },
                        { midi: [G3, B3, D4], label: 'G',  durationMs: 700 },
                        { midi: [G3, B3, D4], label: 'G',  durationMs: 700 },
                    ],
                    bpm: 60
                },
                {
                    type: 'quiz',
                    title: 'Kiểm tra G Major',
                    question: {
                        text: 'Hợp âm G trưởng gồm những nốt nào?',
                        options: ['G – A – B', 'G – B – D', 'G – B – E', 'G – C – D'],
                        correct: 1
                    }
                }
            ]
        },

        // ──────────────────────────────────────────────────────────────────
        {
            id: 'lesson-05',
            title: 'Hợp âm Am thứ (A Minor Chord)',
            description: 'Hợp âm thứ đầu tiên: A – C – E. Nghe buồn, trầm lắng.',
            thumbnail: '🌙',
            xp: 80,
            steps: [
                {
                    type: 'theory',
                    title: 'Hợp âm thứ (Minor)',
                    content: `
                        <h3>Hợp âm Am</h3>
                        <p>Gồm 3 nốt: <strong>A – C – E</strong>. Cảm xúc: <em>buồn, u hoài, trầm lắng</em>.</p>
                        <h3>Khác biệt trưởng vs thứ</h3>
                        <p>Hợp âm trưởng: nốt gốc + 4 phím + 3 phím.<br>
                        Hợp âm thứ: nốt gốc + <strong>3 phím</strong> + 4 phím.<br>
                        Chỉ thay đổi 1 nốt (bậc 3) nhưng cảm xúc hoàn toàn khác!</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Luyện nhấn Am',
                    content: 'Nhấn đồng thời A3 – C4 – E4.',
                    notes: [A3, C4, E4],
                    hint: 'A3 nằm dưới C4. Đếm từ A: + 3 phím = C, + 4 phím = E.'
                },
                {
                    type: 'play',
                    title: 'Vòng Am – C – G',
                    content: 'Chơi vòng hợp âm Am → C → G (mỗi chord 1 nhịp).',
                    sequence: [
                        { midi: [A3, C4, E4], label: 'Am', durationMs: 700 },
                        { midi: [C4, E4, G4], label: 'C',  durationMs: 700 },
                        { midi: [G3, B3, D4], label: 'G',  durationMs: 700 },
                        { midi: [A3, C4, E4], label: 'Am', durationMs: 700 },
                    ],
                    bpm: 60
                },
                {
                    type: 'quiz',
                    title: 'Kiểm tra Am',
                    question: {
                        text: 'Điểm khác biệt giữa C major và Am là gì?',
                        options: [
                            'Am có thêm 1 nốt',
                            'Am dùng nốt E thay vì G',
                            'Am có bậc 3 thấp hơn 1 phím (♭3)',
                            'Am không có nốt C'
                        ],
                        correct: 2
                    }
                }
            ]
        },

        // ──────────────────────────────────────────────────────────────────
        {
            id: 'lesson-06',
            title: 'Hợp âm F trưởng (F Major Chord)',
            description: 'Hoàn thiện vòng C – Am – F – G, vòng hòa thanh đệ nhất.',
            thumbnail: '⭐',
            xp: 90,
            steps: [
                {
                    type: 'theory',
                    title: 'F Major & Vòng vàng',
                    content: `
                        <h3>Hợp âm F trưởng</h3>
                        <p>Gồm 3 nốt: <strong>F – A – C</strong>. Cảm xúc: <em>ấm áp, nhẹ nhàng</em>.</p>
                        <h3>Vòng C – Am – F – G</h3>
                        <p>Đây là vòng hòa thanh phổ biến nhất thế giới.
                        Dùng trong: <em>Let It Be, No Woman No Cry, Despacito, Hơn Cả Yêu...</em></p>
                        <p>Học bước này → bạn có thể đệm hàng trăm bài hát!</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Luyện nhấn F Major',
                    content: 'Nhấn đồng thời F3 – A3 – C4.',
                    notes: [F3, A3, C4],
                    hint: 'F3 nằm dưới G3. Đếm từ F: + 4 phím = A, + 3 phím = C.'
                },
                {
                    type: 'play',
                    title: 'Vòng C – Am – F – G',
                    content: 'Chơi trọn vòng hòa thanh cơ bản nhất.',
                    sequence: [
                        { midi: [C4, E4, G4], label: 'C',  durationMs: 700 },
                        { midi: [A3, C4, E4], label: 'Am', durationMs: 700 },
                        { midi: [F3, A3, C4], label: 'F',  durationMs: 700 },
                        { midi: [G3, B3, D4], label: 'G',  durationMs: 700 },
                    ],
                    bpm: 65
                },
                {
                    type: 'quiz',
                    title: 'Kiểm tra vòng vàng',
                    question: {
                        text: 'Vòng C – Am – F – G thường gặp nhất ở thể loại nhạc nào?',
                        options: ['Jazz phức tạp', 'Pop/Rock/Ballad phổ thông', 'Nhạc cổ điển baroque', 'Nhạc thính phòng'],
                        correct: 1
                    }
                }
            ]
        },

        // ──────────────────────────────────────────────────────────────────
        {
            id: 'lesson-07',
            title: 'Nhịp điệu & Phách (Rhythm)',
            description: 'Hiểu về nhịp 4/4, giá trị nốt nhạc và cảm nhận beat.',
            thumbnail: '🥁',
            xp: 85,
            steps: [
                {
                    type: 'theory',
                    title: 'Nhịp 4/4',
                    content: `
                        <h3>Nhịp 4/4 — Nhịp phổ biến nhất</h3>
                        <p>Nhịp 4/4 có 4 phách trong mỗi ô nhịp. Phách 1 và 3 mạnh, phách 2 và 4 nhẹ.</p>
                        <h3>Giá trị nốt nhạc</h3>
                        <ul>
                            <li><strong>Nốt tròn (whole):</strong> 4 phách — dài nhất</li>
                            <li><strong>Nốt trắng (half):</strong> 2 phách</li>
                            <li><strong>Nốt đen (quarter):</strong> 1 phách — đơn vị cơ bản</li>
                            <li><strong>Nốt móc đơn (eighth):</strong> ½ phách</li>
                        </ul>
                        <h3>BPM</h3>
                        <p>BPM (Beats Per Minute) = số phách mỗi phút. 60 BPM = 1 phách/giây.</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Nhấn theo đếm 1-2-3-4',
                    content: 'Nghe metronome và nhấn nốt C4 đúng vào mỗi phách (4 phách).',
                    notes: [C4],
                    hint: 'Đếm thầm: MỘT – hai – BA – bốn (1, 3 mạnh hơn).',
                    bpm: 60,
                    repeatCount: 4
                },
                {
                    type: 'play',
                    title: 'Gam C theo nốt đen',
                    content: 'Chơi gam C lên rồi xuống, mỗi nốt đúng 1 phách.',
                    sequence: [
                        { midi: C4, label: 'C',  durationMs: 500 },
                        { midi: D4, label: 'D',  durationMs: 500 },
                        { midi: E4, label: 'E',  durationMs: 500 },
                        { midi: F4, label: 'F',  durationMs: 500 },
                        { midi: G4, label: 'G',  durationMs: 500 },
                        { midi: A4, label: 'A',  durationMs: 500 },
                        { midi: B4, label: 'B',  durationMs: 500 },
                        { midi: C5, label: 'C5', durationMs: 500 },
                        { midi: B4, label: 'B',  durationMs: 500 },
                        { midi: A4, label: 'A',  durationMs: 500 },
                        { midi: G4, label: 'G',  durationMs: 500 },
                        { midi: F4, label: 'F',  durationMs: 500 },
                        { midi: E4, label: 'E',  durationMs: 500 },
                        { midi: D4, label: 'D',  durationMs: 500 },
                        { midi: C4, label: 'C',  durationMs: 700 },
                    ],
                    bpm: 72
                },
                {
                    type: 'quiz',
                    title: 'Kiểm tra nhịp',
                    question: {
                        text: 'Một ô nhịp 4/4 ở 120 BPM kéo dài bao nhiêu giây?',
                        options: ['1 giây', '2 giây', '3 giây', '4 giây'],
                        correct: 1
                    }
                }
            ]
        },

        // ──────────────────────────────────────────────────────────────────
        {
            id: 'lesson-08',
            title: 'Đảo bậc hợp âm (Chord Inversions)',
            description: 'Học cách chuyển hợp âm mượt mà hơn bằng đảo bậc.',
            thumbnail: '🔄',
            xp: 100,
            steps: [
                {
                    type: 'theory',
                    title: 'Đảo bậc là gì?',
                    content: `
                        <h3>Đảo bậc (Inversion)</h3>
                        <p>Đảo bậc = giữ nguyên các nốt nhưng thay đổi nốt thấp nhất (bass).</p>
                        <table style="width:100%;border-collapse:collapse;margin:8px 0">
                            <tr style="border-bottom:1px solid rgba(255,255,255,0.2)">
                                <th style="text-align:left;padding:4px 0">C Major</th>
                                <th style="text-align:left;padding:4px 0">Nốt</th>
                            </tr>
                            <tr><td>Bậc gốc</td><td>C – E – G</td></tr>
                            <tr><td>Đảo 1</td><td>E – G – C</td></tr>
                            <tr><td>Đảo 2</td><td>G – C – E</td></tr>
                        </table>
                        <h3>Tại sao dùng đảo bậc?</h3>
                        <p>Giảm khoảng cách tay khi chuyển chord → nhạc nghe mượt mà hơn.</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'C Major 3 dạng đảo',
                    content: 'Nhấn lần lượt 3 dạng đảo bậc của C Major.',
                    notes: [C4, E4, G4],
                    hint: 'Bậc gốc: C-E-G | Đảo 1: E-G-C5 | Đảo 2: G-C5-E5'
                },
                {
                    type: 'play',
                    title: 'Chuyển C → Am với đảo bậc',
                    content: 'Dùng đảo bậc để chuyển mượt từ C sang Am (giảm tối đa khoảng cách tay).',
                    sequence: [
                        { midi: [C4, E4, G4], label: 'C (root)',    durationMs: 800 },
                        { midi: [E4, G4, C5], label: 'C (inv1)',    durationMs: 800 },
                        { midi: [A3, E4, A4], label: 'Am (root)',   durationMs: 800 },
                        { midi: [C4, E4, A4], label: 'Am (inv1)',   durationMs: 800 },
                    ],
                    bpm: 55
                },
                {
                    type: 'quiz',
                    title: 'Kiểm tra đảo bậc',
                    question: {
                        text: 'Đảo bậc 1 của C Major là gì?',
                        options: ['C – E – G', 'E – G – C', 'G – C – E', 'B – C – E'],
                        correct: 1
                    }
                }
            ]
        },

        // ──────────────────────────────────────────────────────────────────
        {
            id: 'lesson-09',
            title: 'Kiểu đệm Arpeggio',
            description: 'Rải hợp âm theo từng nốt để tạo âm thanh nhẹ nhàng, cuốn hút.',
            thumbnail: '🌊',
            xp: 110,
            steps: [
                {
                    type: 'theory',
                    title: 'Arpeggio',
                    content: `
                        <h3>Arpeggio (Rải hợp âm)</h3>
                        <p>Thay vì nhấn tất cả nốt cùng lúc, bạn nhấn từng nốt lần lượt (từ thấp lên cao).
                        Ví dụ: C major block = C+E+G cùng lúc. C major arpeggio = C → E → G → C...</p>
                        <h3>Cảm xúc</h3>
                        <p>Arpeggio tạo cảm giác <em>nhẹ nhàng, trôi chảy, tinh tế</em>. Dùng nhiều trong ballad.</p>
                        <h3>Pattern phổ biến</h3>
                        <p>Pattern 3 nốt: <strong>1 – 3 – 5 – 3 – 1...</strong></p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Rải C Major lên',
                    content: 'Nhấn lần lượt C4 → E4 → G4 → C5 (từng nốt, không nhấn cùng lúc).',
                    notes: [C4, E4, G4, C5],
                    hint: 'Mỗi nốt nhấn và thả trước khi nhấn nốt tiếp theo.'
                },
                {
                    type: 'play',
                    title: 'Arpeggio vòng C – Am – F – G',
                    content: 'Rải từng hợp âm trong vòng vàng theo pattern lên.',
                    sequence: [
                        { midi: C4,  label: 'C',  durationMs: 300 },
                        { midi: E4,  label: 'E',  durationMs: 300 },
                        { midi: G4,  label: 'G',  durationMs: 300 },
                        { midi: A3,  label: 'A',  durationMs: 300 },
                        { midi: C4,  label: 'C',  durationMs: 300 },
                        { midi: E4,  label: 'E',  durationMs: 300 },
                        { midi: F3,  label: 'F',  durationMs: 300 },
                        { midi: A3,  label: 'A',  durationMs: 300 },
                        { midi: C4,  label: 'C',  durationMs: 300 },
                        { midi: G3,  label: 'G',  durationMs: 300 },
                        { midi: B3,  label: 'B',  durationMs: 300 },
                        { midi: D4,  label: 'D',  durationMs: 300 },
                    ],
                    bpm: 80
                },
                {
                    type: 'quiz',
                    title: 'Kiểm tra Arpeggio',
                    question: {
                        text: 'Arpeggio khác Block chord ở điểm nào?',
                        options: [
                            'Arpeggio dùng ít nốt hơn',
                            'Arpeggio nhấn từng nốt lần lượt thay vì cùng lúc',
                            'Arpeggio chỉ dùng cho tay trái',
                            'Arpeggio nghe to hơn'
                        ],
                        correct: 1
                    }
                }
            ]
        },

        // ──────────────────────────────────────────────────────────────────
        {
            id: 'lesson-10',
            title: 'Bài tổng hợp: Ballad đơn giản',
            description: 'Áp dụng tất cả kỹ năng đã học: gam, chord, arpeggio vào một đoạn nhạc ngắn.',
            thumbnail: '🏆',
            xp: 150,
            steps: [
                {
                    type: 'theory',
                    title: 'Ôn tập & Kế hoạch bài tổng hợp',
                    content: `
                        <h3>Bạn đã học được:</h3>
                        <ul>
                            <li>✅ Gam C trưởng (8 nốt)</li>
                            <li>✅ 4 hợp âm cơ bản: C, Am, F, G</li>
                            <li>✅ Đảo bậc hợp âm</li>
                            <li>✅ Kiểu đệm arpeggio</li>
                            <li>✅ Nhịp 4/4</li>
                        </ul>
                        <h3>Bài hôm nay</h3>
                        <p>Chơi một đoạn nhạc ngắn 8 ô nhịp kết hợp melody tay phải + chord tay trái.
                        Đây là thành tựu lớn — người mới học thường mất 2–3 tháng để đến đây!</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Melody tay phải',
                    content: 'Luyện giai điệu đơn giản bằng tay phải: E – E – G – G – A – G (nghỉ) – F – F – E...',
                    notes: [E4, G4, A4, G4, F4, E4, D4, C4],
                    hint: 'Chỉ chú ý tay phải trước, không cần chord.'
                },
                {
                    type: 'play',
                    title: 'Tay phải melody hoàn chỉnh',
                    content: 'Chơi melody 8 nốt theo nhịp đều, mỗi nốt 1 phách.',
                    sequence: [
                        { midi: E4, label: 'E', durationMs: 550 },
                        { midi: E4, label: 'E', durationMs: 550 },
                        { midi: G4, label: 'G', durationMs: 550 },
                        { midi: A4, label: 'A', durationMs: 550 },
                        { midi: G4, label: 'G', durationMs: 550 },
                        { midi: E4, label: 'E', durationMs: 550 },
                        { midi: D4, label: 'D', durationMs: 550 },
                        { midi: C4, label: 'C', durationMs: 800 },
                    ],
                    bpm: 70
                },
                {
                    type: 'quiz',
                    title: 'Hoàn thành khóa học cơ bản! 🎉',
                    question: {
                        text: 'Trong vòng C – Am – F – G, hợp âm nào mang chức năng "Chủ âm (Tonic)"?',
                        options: ['Am', 'F', 'C', 'G'],
                        correct: 2
                    }
                }
            ]
        }
    ];

    return {
        getAll:   ()    => LESSONS,
        getById:  id    => LESSONS.find(l => l.id === id) || null,
        getCount: ()    => LESSONS.length,
    };
})();
