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
    const Ds4=63, Fs4=66;
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
        },

        // ══════════════════════════════════════════════════════════
        //  INTERMEDIATE (Bài 11-20)
        // ══════════════════════════════════════════════════════════

        {
            id: 'lesson-11',
            title: 'Giọng La thứ tự nhiên (A Natural Minor)',
            description: 'Gam thứ — cảm xúc buồn và sâu lắng. Nền tảng của hàng nghìn bài nhạc buồn.',
            thumbnail: '🌙',
            xp: 120,
            steps: [
                {
                    type: 'theory',
                    title: 'Gam La thứ tự nhiên',
                    content: `
                        <h3>A Natural Minor: A – B – C – D – E – F – G – A</h3>
                        <p>Đây là gam thứ phổ biến nhất, dùng trong pop, rock, ballad buồn.
                        So với C Major: toàn bộ nốt giống nhau nhưng bắt đầu từ <strong>A</strong>.</p>
                        <h3>Công thức khoảng cách</h3>
                        <p>T – ST – T – T – ST – T – T (T=tone, ST=semitone)</p>
                        <h3>Cảm xúc</h3>
                        <p>Buồn, u hoài, trầm tư — khác hoàn toàn với C Major (sáng, vui).</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Nhận biết 8 nốt Am',
                    content: 'Nhấn lần lượt từng nốt gam Am: A – B – C – D – E – F – G – A',
                    notes: [A3, B3, C4, D4, E4, F4, G4, A4],
                    hint: 'Bắt đầu từ A3 (A dưới C4). Tất cả đều là phím trắng!'
                },
                {
                    type: 'play',
                    title: 'Chạy gam Am lên và xuống',
                    content: 'Chơi gam Am từ A3 lên A4 rồi xuống lại.',
                    sequence: [
                        { midi: A3, label: 'A',  durationMs: 500 },
                        { midi: B3, label: 'B',  durationMs: 500 },
                        { midi: C4, label: 'C',  durationMs: 500 },
                        { midi: D4, label: 'D',  durationMs: 500 },
                        { midi: E4, label: 'E',  durationMs: 500 },
                        { midi: F4, label: 'F',  durationMs: 500 },
                        { midi: G4, label: 'G',  durationMs: 500 },
                        { midi: A4, label: 'A',  durationMs: 700 },
                    ],
                    bpm: 72
                },
                {
                    type: 'quiz',
                    title: 'Kiểm tra gam Am',
                    question: {
                        text: 'Gam A Natural Minor và C Major có điểm gì chung?',
                        options: [
                            'Cùng bắt đầu từ nốt C',
                            'Cùng dùng các phím trắng (cùng nốt, khác bắt đầu)',
                            'Cùng cảm xúc vui vẻ',
                            'Không có điểm gì chung'
                        ],
                        correct: 1
                    }
                }
            ]
        },

        {
            id: 'lesson-12',
            title: 'Pentatonic — Gam 5 nốt huyền thoại',
            description: 'Gam pentatonic minor: đơn giản nhất để tạo melody hay ngay lập tức.',
            thumbnail: '⭐',
            xp: 130,
            steps: [
                {
                    type: 'theory',
                    title: 'Pentatonic Minor',
                    content: `
                        <h3>Pentatonic Minor: A – C – D – E – G</h3>
                        <p>Chỉ 5 nốt nhưng tạo ra âm thanh "nghe hay ngay" — dùng trong blues, rock, pop Việt.
                        Bí quyết: bất kỳ 2 nốt nào trong gam đều "hòa" với nhau!</p>
                        <h3>Tại sao dễ?</h3>
                        <p>Không có nốt "căng thẳng" — mọi tổ hợp đều nghe ổn.
                        Đây là lý do guitarists dùng pentatonic để improv.</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Luyện 5 nốt Pentatonic',
                    content: 'Nhấn lần lượt 5 nốt: A – C – D – E – G (bỏ qua B và F)',
                    notes: [A3, C4, D4, E4, G4],
                    hint: 'Nhớ: BỎ QUA B và F. Chỉ nhấn A, C, D, E, G.'
                },
                {
                    type: 'play',
                    title: 'Melody pentatonic đơn giản',
                    content: 'Chơi chuỗi nốt này — đây là phong cách blues!',
                    sequence: [
                        { midi: A3,  label: 'A', durationMs: 400 },
                        { midi: C4,  label: 'C', durationMs: 400 },
                        { midi: D4,  label: 'D', durationMs: 400 },
                        { midi: E4,  label: 'E', durationMs: 600 },
                        { midi: D4,  label: 'D', durationMs: 400 },
                        { midi: C4,  label: 'C', durationMs: 400 },
                        { midi: A3,  label: 'A', durationMs: 700 },
                    ],
                    bpm: 80
                },
                {
                    type: 'quiz',
                    title: 'Kiểm tra pentatonic',
                    question: {
                        text: 'Pentatonic Minor (key Am) có bao nhiêu nốt?',
                        options: ['4 nốt', '5 nốt', '7 nốt', '8 nốt'],
                        correct: 1
                    }
                }
            ]
        },

        {
            id: 'lesson-13',
            title: 'Twinkle Twinkle Little Star',
            description: 'Bài đầu tiên chơi melody đơn giản và quen thuộc.',
            thumbnail: '⭐',
            xp: 140,
            steps: [
                {
                    type: 'theory',
                    title: 'Đọc melody từ tên nốt',
                    content: `
                        <h3>Twinkle Twinkle Little Star</h3>
                        <p>Một trong những bài đầu tiên mọi pianist học.
                        Melody hoàn toàn dùng gam C trưởng — không có phím đen!</p>
                        <h3>Cấu trúc</h3>
                        <p>C C G G A A G — (nghỉ) — F F E E D D C</p>
                        <p>Mỗi nốt giữ đúng 1 phách. Nhịp độ: từ tốn, ~72 BPM.</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Luyện từng cụm 7 nốt',
                    content: 'Nhấn đúng 7 nốt đầu: C – C – G – G – A – A – G',
                    notes: [C4, C4, G4, G4, A4, A4, G4],
                    hint: 'Ngón tay: 1(C) – 1(C) – 5(G) – 5(G) – dịch lên – A – A – G'
                },
                {
                    type: 'play',
                    title: 'Twinkle Twinkle đoạn 1',
                    content: 'Chơi đoạn đầu theo nhịp.',
                    sequence: [
                        { midi: C4, label: 'C', durationMs: 500 },
                        { midi: C4, label: 'C', durationMs: 500 },
                        { midi: G4, label: 'G', durationMs: 500 },
                        { midi: G4, label: 'G', durationMs: 500 },
                        { midi: A4, label: 'A', durationMs: 500 },
                        { midi: A4, label: 'A', durationMs: 500 },
                        { midi: G4, label: 'G', durationMs: 700 },
                        { midi: F4, label: 'F', durationMs: 500 },
                        { midi: F4, label: 'F', durationMs: 500 },
                        { midi: E4, label: 'E', durationMs: 500 },
                        { midi: E4, label: 'E', durationMs: 500 },
                        { midi: D4, label: 'D', durationMs: 500 },
                        { midi: D4, label: 'D', durationMs: 500 },
                        { midi: C4, label: 'C', durationMs: 800 },
                    ],
                    bpm: 80
                },
                {
                    type: 'quiz',
                    title: 'Kiểm tra bài đầu tiên',
                    question: {
                        text: 'Trong "Twinkle Twinkle", sau 2 nốt C C là nốt gì?',
                        options: ['D D', 'E E', 'F F', 'G G'],
                        correct: 3
                    }
                }
            ]
        },

        {
            id: 'lesson-14',
            title: 'Hợp âm D trưởng & E thứ',
            description: 'Hai hợp âm mới để hoàn thiện giọng G trưởng và D trưởng.',
            thumbnail: '🎸',
            xp: 130,
            steps: [
                {
                    type: 'theory',
                    title: 'D Major và Em',
                    content: `
                        <h3>D Major: D – F# – A</h3>
                        <p>Chú ý: F# là phím ĐEN! Đây là hợp âm đầu tiên có phím đen.
                        Cảm xúc: sáng, năng lượng, tự tin.</p>
                        <h3>E Minor: E – G – B</h3>
                        <p>Hợp âm thứ — buồn, u hoài. Dùng nhiều trong nhạc pop/rock.</p>
                        <h3>Vòng G Major</h3>
                        <p>G – D – Em – C: một trong những vòng phổ biến nhất thế giới!</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Luyện D Major (có phím đen)',
                    content: 'Nhấn D4 – F#4 – A4. F#4 là phím ĐEN giữa F và G.',
                    notes: [D4, Fs4, A4],
                    hint: 'F#4 = phím đen nằm ngay bên phải F4.'
                },
                {
                    type: 'play',
                    title: 'Vòng G – D – Em – C',
                    content: 'Chơi vòng 4 hợp âm mạnh nhất của nhạc pop.',
                    sequence: [
                        { midi: [G3, B3, D4], label: 'G',  durationMs: 700 },
                        { midi: [D4, Fs4, A4], label: 'D',  durationMs: 700 },
                        { midi: [E4, G4, B4], label: 'Em', durationMs: 700 },
                        { midi: [C4, E4, G4], label: 'C',  durationMs: 700 },
                    ],
                    bpm: 65
                },
                {
                    type: 'quiz',
                    title: 'Kiểm tra D Major',
                    question: {
                        text: 'D Major gồm nốt nào? (Chú ý phím đen)',
                        options: ['D – F – A', 'D – F# – A', 'D – E – A', 'D – G – A'],
                        correct: 1
                    }
                }
            ]
        },

        {
            id: 'lesson-15',
            title: 'Nhịp 3/4 — Điệu Waltz',
            description: 'Nhịp của vũ điệu Waltz: 1-2-3, 1-2-3. Nghe ngay là nhận ra!',
            thumbnail: '💃',
            xp: 135,
            steps: [
                {
                    type: 'theory',
                    title: 'Nhịp 3/4',
                    content: `
                        <h3>3 phách mỗi ô nhịp</h3>
                        <p>Khác với 4/4, nhịp 3/4 có <strong>3 phách</strong>: mạnh – nhẹ – nhẹ.
                        Cảm giác như đang xoay tròn, nhẹ nhàng, lãng mạn.</p>
                        <h3>Kiểu đệm Waltz cơ bản</h3>
                        <p>Tay trái: BASS (phách 1) – CHORD (phách 2) – CHORD (phách 3)</p>
                        <h3>Bài nhạc nổi tiếng</h3>
                        <p>Happy Birthday, My Heart Will Go On (phần intro), nhiều bản nhạc cổ điển.</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Đếm nhịp 1-2-3',
                    content: 'Nhấn C4 đúng vào phách 1 (mạnh), D4 vào phách 2, E4 vào phách 3. Lặp lại.',
                    notes: [C4, D4, E4],
                    hint: 'Đếm: MỘT – hai – ba, MỘT – hai – ba...'
                },
                {
                    type: 'play',
                    title: 'Melody 3/4 đơn giản',
                    content: 'Chơi pattern waltz với gam C trưởng.',
                    sequence: [
                        { midi: C4, label: '1', durationMs: 700 },
                        { midi: E4, label: '2', durationMs: 500 },
                        { midi: G4, label: '3', durationMs: 500 },
                        { midi: E4, label: '1', durationMs: 700 },
                        { midi: C4, label: '2', durationMs: 500 },
                        { midi: E4, label: '3', durationMs: 500 },
                        { midi: G4, label: '1', durationMs: 700 },
                        { midi: E4, label: '2', durationMs: 500 },
                        { midi: C5, label: '3', durationMs: 700 },
                    ],
                    bpm: 90
                },
                {
                    type: 'quiz',
                    title: 'Kiểm tra nhịp 3/4',
                    question: {
                        text: 'Nhịp 3/4 khác nhịp 4/4 ở điểm gì chính?',
                        options: [
                            '3/4 nhanh hơn 4/4',
                            '3/4 có 3 phách mỗi ô nhịp, 4/4 có 4 phách',
                            '3/4 chỉ dùng cho nhạc buồn',
                            '3/4 không có phách mạnh'
                        ],
                        correct: 1
                    }
                }
            ]
        },

        {
            id: 'lesson-16',
            title: 'Lý thuyết: Cung và Quãng',
            description: 'Hiểu cách tính khoảng cách giữa các nốt — nền tảng để tự tạo hợp âm.',
            thumbnail: '📐',
            xp: 150,
            steps: [
                {
                    type: 'theory',
                    title: 'Quãng là gì?',
                    content: `
                        <h3>Quãng (Interval)</h3>
                        <p>Quãng = khoảng cách giữa 2 nốt, tính bằng số phím (semitone).</p>
                        <table>
                            <thead><tr><th>Quãng</th><th>Semitones</th><th>Ví dụ</th></tr></thead>
                            <tbody>
                                <tr><td>Quãng 2 thứ</td><td>1</td><td>C → C#</td></tr>
                                <tr><td>Quãng 2 trưởng</td><td>2</td><td>C → D</td></tr>
                                <tr><td>Quãng 3 thứ</td><td>3</td><td>C → Eb</td></tr>
                                <tr><td>Quãng 3 trưởng</td><td>4</td><td>C → E</td></tr>
                                <tr><td>Quãng 5 đúng</td><td>7</td><td>C → G</td></tr>
                                <tr><td>Quãng 8 (octave)</td><td>12</td><td>C → C</td></tr>
                            </tbody>
                        </table>
                        <h3>Ứng dụng</h3>
                        <p>Major chord = nốt gốc + quãng 3 trưởng (4 phím) + quãng 5 đúng (7 phím)</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Nghe quãng 3 trưởng vs thứ',
                    content: 'Nhấn C4 rồi nhấn E4 (quãng 3 trưởng = 4 phím). Nghe sự khác biệt.',
                    notes: [C4, E4],
                    hint: 'Quãng 3 trưởng (C→E) nghe "sáng". Quãng 3 thứ (C→Eb) nghe "buồn".'
                },
                {
                    type: 'play',
                    title: 'Nhận dạng quãng qua tai',
                    content: 'Chơi các quãng khác nhau từ C4.',
                    sequence: [
                        { midi: C4,  label: 'C',  durationMs: 400 },
                        { midi: E4,  label: '3M', durationMs: 600 },
                        { midi: C4,  label: 'C',  durationMs: 400 },
                        { midi: Ds4, label: '3m', durationMs: 600 },
                        { midi: C4,  label: 'C',  durationMs: 400 },
                        { midi: G4,  label: '5',  durationMs: 700 },
                    ],
                    bpm: 70
                },
                {
                    type: 'quiz',
                    title: 'Kiểm tra quãng',
                    question: {
                        text: 'Từ C đến G là quãng bao nhiêu semitone?',
                        options: ['5 semitone', '6 semitone', '7 semitone', '8 semitone'],
                        correct: 2
                    }
                }
            ]
        },

        {
            id: 'lesson-17',
            title: 'Happy Birthday To You',
            description: 'Bài nhạc nổi tiếng nhất thế giới — melody tay phải đầy đủ.',
            thumbnail: '🎂',
            xp: 160,
            steps: [
                {
                    type: 'theory',
                    title: 'Phân tích Happy Birthday',
                    content: `
                        <h3>Happy Birthday — nhịp 3/4</h3>
                        <p>Bài này dùng nhịp 3/4 (đã học ở bài 15).
                        Melody key C Major, không có phím đen.</p>
                        <h3>Cấu trúc melody</h3>
                        <p>Câu 1: C C D C F E<br>
                        Câu 2: C C D C G F<br>
                        Câu 3: C C C5 A4 F E D<br>
                        Câu 4: Bb Bb A F G F</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Luyện câu 1 + 2',
                    content: 'Nhấn câu đầu: C – C – D – C – F – E',
                    notes: [C4, C4, D4, C4, F4, E4],
                    hint: 'Nhịp 3/4 — đếm: 1-và 2 3 | 1 2 3...'
                },
                {
                    type: 'play',
                    title: 'Happy Birthday — 2 câu đầu',
                    content: 'Chơi 2 câu đầu của Happy Birthday.',
                    sequence: [
                        { midi: C4, label: 'C', durationMs: 350 },
                        { midi: C4, label: 'C', durationMs: 350 },
                        { midi: D4, label: 'D', durationMs: 550 },
                        { midi: C4, label: 'C', durationMs: 550 },
                        { midi: F4, label: 'F', durationMs: 550 },
                        { midi: E4, label: 'E', durationMs: 750 },
                        { midi: C4, label: 'C', durationMs: 350 },
                        { midi: C4, label: 'C', durationMs: 350 },
                        { midi: D4, label: 'D', durationMs: 550 },
                        { midi: C4, label: 'C', durationMs: 550 },
                        { midi: G4, label: 'G', durationMs: 550 },
                        { midi: F4, label: 'F', durationMs: 800 },
                    ],
                    bpm: 90
                },
                {
                    type: 'quiz',
                    title: 'Kiểm tra Happy Birthday',
                    question: {
                        text: 'Happy Birthday dùng nhịp gì?',
                        options: ['2/4', '3/4', '4/4', '6/8'],
                        correct: 1
                    }
                }
            ]
        },

        {
            id: 'lesson-18',
            title: 'Tay trái: Bass Notes cơ bản',
            description: 'Bắt đầu phối hợp hai tay — tay trái đánh bass, tay phải đánh melody.',
            thumbnail: '🤲',
            xp: 170,
            steps: [
                {
                    type: 'theory',
                    title: 'Vai trò của tay trái',
                    content: `
                        <h3>Tay trái = nền tảng âm nhạc</h3>
                        <p>Trong piano, tay trái thường đánh:
                        <ul>
                            <li><strong>Bass notes:</strong> nốt thấp đặt nền hòa âm</li>
                            <li><strong>Chords:</strong> hợp âm đệm theo nhịp</li>
                            <li><strong>Arpeggio:</strong> rải hợp âm</li>
                        </ul></p>
                        <h3>Bắt đầu đơn giản</h3>
                        <p>Tay trái nhấn nốt gốc của hợp âm (Bass note) trong khi tay phải đánh melody.
                        C chord → tay trái nhấn C2 hoặc C3.</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Luyện bass notes tay trái',
                    content: 'Nhấn các nốt bass cho vòng C-Am-F-G (tay trái): C3 – A3 – F3 – G3',
                    notes: [C3, A3, F3, G3],
                    hint: 'Tay trái ở octave thấp hơn tay phải. C3 nằm dưới C4.'
                },
                {
                    type: 'play',
                    title: 'Bass line vòng C-Am-F-G',
                    content: 'Chơi bass notes tay trái theo vòng quen thuộc.',
                    sequence: [
                        { midi: C3, label: 'C', durationMs: 700 },
                        { midi: A3, label: 'A', durationMs: 700 },
                        { midi: F3, label: 'F', durationMs: 700 },
                        { midi: G3, label: 'G', durationMs: 700 },
                        { midi: C3, label: 'C', durationMs: 700 },
                        { midi: A3, label: 'A', durationMs: 700 },
                        { midi: F3, label: 'F', durationMs: 700 },
                        { midi: G3, label: 'G', durationMs: 900 },
                    ],
                    bpm: 70
                },
                {
                    type: 'quiz',
                    title: 'Kiểm tra tay trái',
                    question: {
                        text: 'Bass note của hợp âm Am là nốt gì?',
                        options: ['C', 'E', 'A', 'G'],
                        correct: 2
                    }
                }
            ]
        },

        {
            id: 'lesson-19',
            title: 'Hợp âm 7 — Màu sắc nâng cao',
            description: 'Hợp âm 4 nốt: thêm bậc 7 để tạo âm thanh jazz, soul, R&B.',
            thumbnail: '🎷',
            xp: 160,
            steps: [
                {
                    type: 'theory',
                    title: 'Hợp âm 7 (Seventh Chords)',
                    content: `
                        <h3>Tại sao hợp âm 7?</h3>
                        <p>Thêm 1 nốt vào hợp âm 3 → âm thanh "màu sắc" hơn, jazz hơn, ít "plain".</p>
                        <h3>Các loại quan trọng</h3>
                        <table>
                            <thead><tr><th>Loại</th><th>Công thức</th><th>Ví dụ</th></tr></thead>
                            <tbody>
                                <tr><td>Major 7</td><td>1-3-5-7</td><td>Cmaj7: C-E-G-B</td></tr>
                                <tr><td>Minor 7</td><td>1-♭3-5-♭7</td><td>Am7: A-C-E-G</td></tr>
                                <tr><td>Dominant 7</td><td>1-3-5-♭7</td><td>G7: G-B-D-F</td></tr>
                            </tbody>
                        </table>
                        <h3>Dùng khi nào?</h3>
                        <p>Cmaj7 thay C, Am7 thay Am → nhạc nghe "ngọt" và "smooth" hơn.</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Luyện Cmaj7',
                    content: 'Nhấn đồng thời C4 – E4 – G4 – B4 (thêm nốt B vào C Major)',
                    notes: [C4, E4, G4, B4],
                    hint: 'B4 = nốt ngay bên trái C5. Ngón 1-2-3-5 tay phải.'
                },
                {
                    type: 'play',
                    title: 'Vòng jazz cơ bản với chord 7',
                    content: 'Cmaj7 – Am7 – Fmaj7 – G7: vòng pop/jazz phổ biến.',
                    sequence: [
                        { midi: [C4, E4, G4, B4],  label: 'Cmaj7', durationMs: 800 },
                        { midi: [A3, C4, E4, G4],  label: 'Am7',   durationMs: 800 },
                        { midi: [F3, A3, C4, E4],  label: 'Fmaj7', durationMs: 800 },
                        { midi: [G3, B3, D4, F4],  label: 'G7',    durationMs: 800 },
                    ],
                    bpm: 60
                },
                {
                    type: 'quiz',
                    title: 'Kiểm tra chord 7',
                    question: {
                        text: 'Cmaj7 gồm những nốt nào?',
                        options: ['C – E – G', 'C – E – G – B', 'C – E – G – Bb', 'C – D – G – B'],
                        correct: 1
                    }
                }
            ]
        },

        {
            id: 'lesson-20',
            title: 'Bài kiểm tra Trung cấp',
            description: 'Ôn tập và chơi bản nhạc ngắn kết hợp tay trái + tay phải.',
            thumbnail: '🎓',
            xp: 200,
            steps: [
                {
                    type: 'theory',
                    title: 'Ôn tập bài học 11-19',
                    content: `
                        <h3>Những gì bạn đã học (Trung cấp)</h3>
                        <ul>
                            <li>✅ Gam Am Natural Minor + Pentatonic</li>
                            <li>✅ Bài thực chiến: Twinkle, Happy Birthday</li>
                            <li>✅ Hợp âm D, Em — vòng G-D-Em-C</li>
                            <li>✅ Nhịp 3/4 (Waltz)</li>
                            <li>✅ Quãng âm nhạc</li>
                            <li>✅ Tay trái: bass notes</li>
                            <li>✅ Hợp âm 7 (maj7, m7, dom7)</li>
                        </ul>
                        <h3>Bài kiểm tra</h3>
                        <p>Chơi đoạn nhạc kết hợp tất cả kỹ năng trên.
                        Bạn đã sẵn sàng cho cấp Nâng cao!</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Ôn nhanh chord 7',
                    content: 'Nhấn lần lượt: Cmaj7 (C-E-G-B) và Am7 (A-C-E-G)',
                    notes: [C4, E4, G4, B4],
                    hint: 'Đây là 2 chord jazz quan trọng nhất.'
                },
                {
                    type: 'play',
                    title: 'Finale: Melody + bass kết hợp',
                    content: 'Chơi melody gam C trưởng với bass note tay trái.',
                    sequence: [
                        { midi: C4,  label: 'C',  durationMs: 500 },
                        { midi: E4,  label: 'E',  durationMs: 500 },
                        { midi: G4,  label: 'G',  durationMs: 500 },
                        { midi: A4,  label: 'A',  durationMs: 500 },
                        { midi: G4,  label: 'G',  durationMs: 700 },
                        { midi: F4,  label: 'F',  durationMs: 500 },
                        { midi: E4,  label: 'E',  durationMs: 500 },
                        { midi: D4,  label: 'D',  durationMs: 500 },
                        { midi: C4,  label: 'C',  durationMs: 800 },
                    ],
                    bpm: 80
                },
                {
                    type: 'quiz',
                    title: 'Câu hỏi tổng hợp',
                    question: {
                        text: 'Vòng hòa âm nào có tất cả 4 hợp âm: G – D – Em – C?',
                        options: [
                            'Giọng C Major, bậc I-IV-vi-V',
                            'Giọng G Major, bậc I-V-vi-IV',
                            'Giọng Am Natural Minor',
                            'Không có tên cụ thể'
                        ],
                        correct: 1
                    }
                }
            ]
        },

        // ══════════════════════════════════════════════════════════
        //  ADVANCED (Bài 21-25)
        // ══════════════════════════════════════════════════════════

        {
            id: 'lesson-21',
            title: 'Modes — 7 Màu sắc âm nhạc',
            description: 'Khám phá 7 mode từ gam C trưởng: Ionian, Dorian, Phrygian...',
            thumbnail: '🌈',
            xp: 200,
            steps: [
                {
                    type: 'theory',
                    title: 'Mode là gì?',
                    content: `
                        <h3>7 Mode từ gam C trưởng</h3>
                        <p>Mỗi mode là gam C trưởng nhưng bắt đầu từ bậc khác nhau.
                        Mỗi mode có màu sắc cảm xúc hoàn toàn khác:</p>
                        <table>
                            <thead><tr><th>Mode</th><th>Bắt đầu từ</th><th>Cảm xúc</th></tr></thead>
                            <tbody>
                                <tr><td>Ionian (Major)</td><td>C</td><td>Sáng, vui</td></tr>
                                <tr><td>Dorian</td><td>D</td><td>Jazz, funky</td></tr>
                                <tr><td>Phrygian</td><td>E</td><td>Tây Ban Nha, căng</td></tr>
                                <tr><td>Lydian</td><td>F</td><td>Mơ mộng, bay bổng</td></tr>
                                <tr><td>Mixolydian</td><td>G</td><td>Blues, rock</td></tr>
                                <tr><td>Aeolian (Minor)</td><td>A</td><td>Buồn, sâu lắng</td></tr>
                                <tr><td>Locrian</td><td>B</td><td>Tối tăm, không ổn định</td></tr>
                            </tbody>
                        </table>
                        <h3>Ứng dụng thực tế</h3>
                        <p><strong>Dorian</strong>: Santeria (Sublime), So What (Miles Davis)<br>
                        <strong>Lydian</strong>: Flying (John Williams), nhạc phim Disney<br>
                        <strong>Mixolydian</strong>: Sweet Home Alabama, Norwegian Wood</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Chơi Dorian Mode',
                    content: 'Dorian = D E F G A B C D — tất cả phím trắng từ D đến D. Thử nghe sự khác biệt!',
                    notes: [D4, E4, F4, G4, A4, B4, C5, 74],
                    hint: 'Giống gam Am nhưng bậc 6 cao hơn 1 phím (B thay vì Bb). Nghe "funky" hơn!'
                },
                {
                    type: 'play',
                    title: 'Dorian melody',
                    content: 'Chơi gam Dorian — nghe sự khác biệt với Am và C trưởng.',
                    sequence: [
                        { midi: D4,  label: 'D', durationMs: 400 },
                        { midi: F4,  label: 'F', durationMs: 400 },
                        { midi: A4,  label: 'A', durationMs: 400 },
                        { midi: C5,  label: 'C', durationMs: 400 },
                        { midi: B4,  label: 'B', durationMs: 400 },
                        { midi: A4,  label: 'A', durationMs: 400 },
                        { midi: G4,  label: 'G', durationMs: 400 },
                        { midi: D4,  label: 'D', durationMs: 700 },
                    ],
                    bpm: 90
                },
                {
                    type: 'quiz',
                    title: 'Kiểm tra Modes',
                    question: {
                        text: 'Mode nào được dùng nhiều trong nhạc Blues/Rock?',
                        options: ['Lydian', 'Dorian', 'Mixolydian', 'Locrian'],
                        correct: 2
                    }
                }
            ]
        },

        {
            id: 'lesson-22',
            title: 'Chord Extensions: 9th, 11th, 13th',
            description: 'Hợp âm jazz nâng cao — thêm màu sắc tươi phong phú cho nhạc.',
            thumbnail: '🎷',
            xp: 210,
            steps: [
                {
                    type: 'theory',
                    title: 'Extended Chords',
                    content: `
                        <h3>Chord Extension là gì?</h3>
                        <p>Tiếp tục thêm nốt vào hợp âm 7: bậc 9, 11, 13 (= bậc 2, 4, 6 cao hơn 1 octave).</p>
                        <h3>Cmaj9 = C – E – G – B – D</h3>
                        <p>Thêm nốt D (bậc 9) vào Cmaj7. Âm thanh "rộng mở, lộng lẫy".</p>
                        <h3>Khi nào dùng?</h3>
                        <p>Neo-soul (H.E.R., Daniel Caesar), R&B (Ariana Grande), Jazz (Bill Evans).<br>
                        Thay vì Cmaj7 → dùng Cmaj9 để chord "bay" hơn.</p>
                        <h3>Voicing thực tế</h3>
                        <p>Không cần nhấn hết 5 nốt — bỏ bậc 5 (G) để giảm tay: C – E – B – D</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Luyện Cmaj9',
                    content: 'Nhấn C4 – E4 – B4 – D5 (bỏ G để vừa tay).',
                    notes: [C4, E4, B4, 74],
                    hint: 'D5 = midi 74. Ngón 1-2-4-5 tay phải.'
                },
                {
                    type: 'play',
                    title: 'Vòng jazz với extended chords',
                    content: 'Cmaj9 – Am9 – Fmaj9 – G13: vòng neo-soul phổ biến.',
                    sequence: [
                        { midi: [C4, E4, B4, 74],  label: 'Cmaj9',  durationMs: 900 },
                        { midi: [A3, C4, E4, G4],   label: 'Am9',    durationMs: 900 },
                        { midi: [F3, A3, E4, G4],   label: 'Fmaj9',  durationMs: 900 },
                        { midi: [G3, B3, F4, A4],   label: 'G13',    durationMs: 900 },
                    ],
                    bpm: 58
                },
                {
                    type: 'quiz',
                    title: 'Kiểm tra extended chords',
                    question: {
                        text: 'Cmaj9 khác Cmaj7 ở điểm gì?',
                        options: [
                            'Cmaj9 bỏ nốt E',
                            'Cmaj9 thêm nốt bậc 9 (D)',
                            'Cmaj9 chỉ có 3 nốt',
                            'Cmaj9 dùng nốt D♭'
                        ],
                        correct: 1
                    }
                }
            ]
        },

        {
            id: 'lesson-23',
            title: 'Chord Substitution — Nghệ thuật thay thế',
            description: 'Thay một hợp âm bằng hợp âm khác để tạo màu sắc mới.',
            thumbnail: '🔀',
            xp: 220,
            steps: [
                {
                    type: 'theory',
                    title: 'Chord Substitution',
                    content: `
                        <h3>Tại sao thay thế hợp âm?</h3>
                        <p>Cùng chức năng nhưng âm thanh phong phú hơn. Ví dụ:
                        thay G7 bằng Db7 (tritone substitution) — jazz và R&B dùng rất nhiều!</p>
                        <h3>Tritone Substitution</h3>
                        <p>G và Db cách nhau đúng 6 phím (tritone). Chúng chia sẻ 2 nốt quan trọng:
                        G7 = G–B–D–F | Db7 = Db–F–Ab–Cb<br>
                        Cả hai đều có nốt F và B (or Cb) → nghe "resolve" tương tự về C!</p>
                        <h3>Ứng dụng dễ dùng</h3>
                        <p>Relative substitution: thay Am bằng C, thay Em bằng G (cùng họ nốt).
                        Đây là cách đơn giản nhất để làm nhạc "jazz" hơn.</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Luyện: Relative Substitution',
                    content: 'Nhấn C trưởng (C–E–G) rồi Em (E–G–B) — nghe sự tương đồng.',
                    notes: [C4, E4, G4],
                    hint: 'C và Em chia sẻ 2 nốt (E và G). Dùng hoán đổi nhau mà vẫn thuận tai!'
                },
                {
                    type: 'play',
                    title: 'Vòng với substitution',
                    content: 'Chơi C–Am–F–G rồi thay Am bằng C, F bằng Am → C–C–Am–G',
                    sequence: [
                        { midi: [C4, E4, G4],  label: 'C',    durationMs: 700 },
                        { midi: [A3, C4, E4],  label: 'Am',   durationMs: 700 },
                        { midi: [F3, A3, C4],  label: 'F',    durationMs: 700 },
                        { midi: [G3, B3, D4],  label: 'G',    durationMs: 700 },
                        { midi: [C4, E4, G4],  label: 'C',    durationMs: 700 },
                        { midi: [C4, E4, G4],  label: 'C→',   durationMs: 700 },
                        { midi: [A3, C4, E4],  label: '→Am',  durationMs: 700 },
                        { midi: [G3, B3, D4],  label: 'G',    durationMs: 900 },
                    ],
                    bpm: 65
                },
                {
                    type: 'quiz',
                    title: 'Kiểm tra Substitution',
                    question: {
                        text: 'Trong "relative substitution", C Major có thể thay thế hợp âm nào?',
                        options: ['G Major', 'Am', 'Em', 'Dm'],
                        correct: 1
                    }
                }
            ]
        },

        {
            id: 'lesson-24',
            title: 'Phối hợp hai tay hoàn chỉnh',
            description: 'Tay trái đánh chord pattern, tay phải đánh melody — đồng thời.',
            thumbnail: '🤲',
            xp: 250,
            steps: [
                {
                    type: 'theory',
                    title: 'Hai tay độc lập',
                    content: `
                        <h3>Thách thức lớn nhất của Piano</h3>
                        <p>Não bộ phải điều khiển 2 luồng độc lập: tay trái theo nhịp, tay phải theo melody.</p>
                        <h3>Phương pháp học đúng</h3>
                        <ol>
                            <li>Học tay phải thuần thục (melody)</li>
                            <li>Học tay trái thuần thục (chord/bass)</li>
                            <li>Ghép chậm (50% tốc độ)</li>
                            <li>Tăng dần tốc độ</li>
                        </ol>
                        <h3>Pattern tay trái phổ biến</h3>
                        <p><strong>Alberti bass:</strong> bass – chord trên – chord giữa – chord trên<br>
                        Ví dụ C: C3 – G3E4 – E3G3 – G3E4 (lặp lại)</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Tay trái: Alberti Bass pattern',
                    content: 'Luyện pattern tay trái: C3 – E3 – G3 – E3 (4 phách lặp lại)',
                    notes: [C3, E3, G3, E3],
                    hint: 'Giữ tay trái thật ổn định và đều nhịp trước khi ghép tay phải.'
                },
                {
                    type: 'play',
                    title: 'Melody đơn giản (tay phải)',
                    content: 'Chơi melody: C – E – G – A – G – E – C theo nhịp.',
                    sequence: [
                        { midi: C4, label: 'C', durationMs: 500 },
                        { midi: E4, label: 'E', durationMs: 500 },
                        { midi: G4, label: 'G', durationMs: 500 },
                        { midi: A4, label: 'A', durationMs: 500 },
                        { midi: G4, label: 'G', durationMs: 500 },
                        { midi: E4, label: 'E', durationMs: 500 },
                        { midi: C4, label: 'C', durationMs: 800 },
                    ],
                    bpm: 75
                },
                {
                    type: 'quiz',
                    title: 'Kiểm tra hai tay',
                    question: {
                        text: 'Phương pháp học đúng khi học ghép 2 tay là gì?',
                        options: [
                            'Ghép ngay từ đầu với tốc độ cao',
                            'Học từng tay riêng trước, rồi ghép chậm, tăng dần',
                            'Chỉ học tay phải là đủ',
                            'Xem video rồi bắt chước'
                        ],
                        correct: 1
                    }
                }
            ]
        },

        {
            id: 'lesson-25',
            title: 'Bài Tốt nghiệp: Tự soạn nhạc',
            description: 'Dùng tất cả kiến thức đã học để soạn một đoạn nhạc 8 ô nhịp của riêng bạn.',
            thumbnail: '🎓',
            xp: 300,
            steps: [
                {
                    type: 'theory',
                    title: 'Soạn nhạc — Không khó như bạn nghĩ',
                    content: `
                        <h3>Công thức soạn nhạc đơn giản</h3>
                        <p>Chọn 1 trong 3 công thức sau:</p>
                        <table>
                            <thead><tr><th>Công thức</th><th>Ví dụ</th><th>Phong cách</th></tr></thead>
                            <tbody>
                                <tr><td>I – V – vi – IV</td><td>C – G – Am – F</td><td>Pop, ballad</td></tr>
                                <tr><td>i – VII – VI – VII</td><td>Am – G – F – G</td><td>Rock, nhạc Việt</td></tr>
                                <tr><td>ii – V – I</td><td>Dm – G – C</td><td>Jazz</td></tr>
                            </tbody>
                        </table>
                        <h3>Cách tạo melody</h3>
                        <p>Dùng các nốt trong gam (hoặc pentatonic) + thêm "neighbor notes" (nốt liền kề)
                        để tạo sự dịch chuyển mượt mà.</p>
                        <h3>Chúc mừng! 🎉</h3>
                        <p>Bạn đã hoàn thành 25 bài học — tương đương 3-6 tháng học với giáo viên!
                        Hãy tiếp tục luyện tập và khám phá những bài nhạc bạn yêu thích.</p>
                    `
                },
                {
                    type: 'practice',
                    title: 'Soạn câu mở đầu',
                    content: 'Dùng các nốt C – E – G – A – G bất kỳ thứ tự bạn muốn. Không có câu trả lời sai!',
                    notes: [C4, E4, G4, A4],
                    hint: 'Hãy thử: bắt đầu từ G, dùng nốt liền kề C-D-E, kết thúc tại C.'
                },
                {
                    type: 'play',
                    title: 'Vòng chord cho bài soạn của bạn',
                    content: 'Chơi vòng I-V-vi-IV (C-G-Am-F) — nền tảng cho hàng trăm bài hát.',
                    sequence: [
                        { midi: [C4, E4, G4], label: 'C',  durationMs: 800 },
                        { midi: [G3, B3, D4], label: 'G',  durationMs: 800 },
                        { midi: [A3, C4, E4], label: 'Am', durationMs: 800 },
                        { midi: [F3, A3, C4], label: 'F',  durationMs: 800 },
                        { midi: [C4, E4, G4], label: 'C',  durationMs: 800 },
                        { midi: [G3, B3, D4], label: 'G',  durationMs: 800 },
                        { midi: [A3, C4, E4], label: 'Am', durationMs: 800 },
                        { midi: [F3, A3, C4], label: 'F',  durationMs: 1000 },
                    ],
                    bpm: 70
                },
                {
                    type: 'quiz',
                    title: '🎓 Câu hỏi cuối khóa',
                    question: {
                        text: 'Pentatonic minor rất phổ biến vì lý do gì?',
                        options: [
                            'Nó có nhiều nốt hơn gam trưởng',
                            'Bất kỳ tổ hợp nốt nào cũng nghe hay — không có nốt xấu',
                            'Nó chỉ dùng phím đen',
                            'Nó là gam duy nhất trong nhạc jazz'
                        ],
                        correct: 1
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
