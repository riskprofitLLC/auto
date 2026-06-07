3:23 PMClaude responded: Промт для AI-редизайна мобильного приложенияПромт для AI-редизайна мобильного приложения

КОНТЕКСТ
Это React Native / Expo приложение для управления автомобилем через Bluetooth (BLE). Функции: запуск двигателя, управление багажником, BSM, подогрев/вентиляция сидений и руля, мониторинг давления шин (TPMS), атмосферная подсветка. Язык интерфейса — русский.

ЦЕЛЬ
Полный редизайн UI/UX в тёмной теме в стиле премиального автомобильного интерфейса (вдохновение: Tesla, BMW iDrive, Rivian). Никаких светлых фонов. Акцент на читаемость, тактильность кнопок и современную эстетику.

ДИЗАЙН-СИСТЕМА (применить везде)
Цветовая палитра
Background Primary:   #0A0A0F  (почти чёрный, с синеватым оттенком)
Background Card:      #12121A  (карточки)
Background Elevated:  #1A1A26  (приподнятые элементы)
Surface:              #1E1E2E  (поверхности)

Accent Primary:       #4F8EF7  (синий — основные действия)
Accent Green:         #22C55E  (активные состояния, двигатель ON)
Accent Red:           #EF4444  (стоп, опасность, отключить)
Accent Orange:        #F59E0B  (предупреждения, подогрев)
Accent Cyan:          #06B6D4  (вентиляция, холод)
Accent Purple:        #A855F7  (багажник, атмосферная подсветка)

Text Primary:         #F1F5F9
Text Secondary:       #94A3B8
Text Muted:           #475569

Border:               rgba(255,255,255,0.08)
Border Active:        rgba(79,142,247,0.4)

Glow Blue:            rgba(79,142,247,0.15)
Glow Green:           rgba(34,197,94,0.15)
Glow Red:             rgba(239,68,68,0.15)
Типографика
Font sizes: xs=10, sm=12, md=14, lg=16, xl=18, 2xl=22, 3xl=28
Font weights: regular=400, medium=500, semibold=600, bold=700
Letter spacing для заголовков: 0.5-1px
Скругления и тени
Border radius: sm=8, md=12, lg=16, xl=20, 2xl=24, full=999
Shadow (активные карточки): тёмные тени + цветное свечение через borderColor

ЭТАП 1 — ГЛОБАЛЬНЫЕ СТИЛИ И КОНСТАНТЫ
Файл: src/constants/theme.ts

Заменить все цвета на новую тёмную палитру выше
Добавить объект DarkColors с полным набором токенов
Добавить константы BorderRadius, Shadows, Typography
Экспортировать darkTheme как основную тему


ЭТАП 2 — ГЛАВНЫЙ ЭКРАН (src/app/index.tsx)

Фон: #0A0A0F
Убрать backgroundColor: '#F8F9FA' везде
Плейсхолдер при отсутствии подключения:

Тёмная карточка с иконкой Bluetooth (💠 или SVG)
Текст: "Устройство не подключено" — Text Secondary
Подтекст: "Откройте меню ☰ для поиска" — Text Muted
Лёгкая пульсирующая анимация (Animated opacity 0.4 → 1.0, loop)




ЭТАП 3 — ТОПБАР (src/components/TopBar.tsx)
Полный редизайн:

Фон: #12121A + нижняя граница rgba(255,255,255,0.06)
Высота: 64px
Кнопка меню ☰:

Фон: rgba(255,255,255,0.06), скругление 10px, размер 40×40
Иконка белая


Центральная зона (статус):

При подключении: зелёная точка (8px, анимированная pulse) + название устройства белым текстом, fontWeight: 600
Без подключения: текст "Нет соединения" серым курсивом


Индикаторы справа:

Заменить эмодзи на цветные pill-бейджи (маленькие rounded капсулы)
relay ON → зелёный бейдж "ДВС"
steering ON → оранжевый бейдж "РУЛЬ"
seat heat → оранжевый бейдж "🔥"
seat vent → голубой бейдж "💨"




ЭТАП 4 — ТОП-ТУЛБАР (src/components/TopToolbar.tsx)

Фон: #0A0A0F (сливается с основным экраном)
Кнопки-пилюли горизонтальный скролл (ScrollView horizontal)
Каждая кнопка:

background: #1A1A26
border: 1px solid rgba(255,255,255,0.08)
borderRadius: 20
paddingHorizontal: 14, paddingVertical: 8

Иконка + текст в одну строку, текст Text Secondary
При нажатии: краткий highlight (opacity 0.7)
Кнопка "Шины" — добавить цветную точку-индикатор (зелёная если давление OK)
Кнопка "💡" атмосферной подсветки — если включена, рамка светится фиолетовым


ЭТАП 5 — КАРТОЧКИ УПРАВЛЕНИЯ (src/components/CarControls.tsx)
Общие карточки (sectionCard):
background: #12121A
borderRadius: 20
border: 1px solid rgba(255,255,255,0.07)
padding: 16
marginBottom: 14
shadow: elevation 4, color #000, opacity 0.4
Заголовки секций:
fontSize: 11
fontWeight: 600
letterSpacing: 1.5
color: #475569  (Text Muted)
textTransform: 'uppercase'
marginBottom: 14
Кнопка двигателя (ToggleBtn large):
ВЫКЛЮЧЕН:
background: #1A1A26
border: 1px solid rgba(239,68,68,0.3)
borderRadius: 16
height: 90px
width: 100%
иконка 🔑 32px
текст "ЗАПУСТИТЬ" — зелёный #22C55E, bold, letterSpacing 1
ВКЛЮЧЁН:
background: linear gradient заменить на: rgba(34,197,94,0.15)
border: 1.5px solid #22C55E
добавить subtle glow через shadow: color #22C55E, opacity 0.3, radius 12
иконка 🛑 32px
текст "ОСТАНОВИТЬ" — красный #EF4444
Статус "двигатель работает":
background: rgba(34,197,94,0.1)
borderRadius: 10
текст зелёный с анимированной точкой пульсации слева
Карточки управления (cardSmall — 2 колонки):
background: #1A1A26
borderRadius: 16
border: 1px solid rgba(255,255,255,0.06)
padding: 12
Заголовок карточки:
color: #94A3B8
fontSize: 11
fontWeight: 600
letterSpacing: 1
uppercase
Малые кнопки (ToggleBtn small/medium):
ВЫКЛЮЧЕНА:
background: rgba(255,255,255,0.04)
border: 1px solid rgba(255,255,255,0.08)
borderRadius: 12
текст: #94A3B8
ВКЛЮЧЕНА (примеры):

Подогрев: background: rgba(245,158,11,0.15), border оранжевый, текст белый
Вентиляция: background: rgba(6,182,212,0.15), border голубой, текст белый
Багажник: background: rgba(168,85,247,0.15), border фиолетовый, текст белый
BSM: background: rgba(34,197,94,0.15), border зелёный, текст белый

Loading состояние:

Заменить ⏳ на ActivityIndicator с цветом акцента

Locked состояние (климат при выкл. двигателе):
opacity: 0.35
border: 1px solid rgba(255,255,255,0.04)
Сообщение о блокировке:
background: rgba(239,68,68,0.08)
border: 1px solid rgba(239,68,68,0.15)
borderRadius: 10
текст: #EF4444, fontSize 12
иконка 🔒 слева

ЭТАП 6 — СКАНЕР УСТРОЙСТВ (src/components/DeviceScanner.tsx)
Modal:
background: #0F0F18
borderTopRadius: 28
Заголовок:
текст белый bold
разделитель: rgba(255,255,255,0.06)
кнопка ✕: круглая 36×36, bg rgba(255,255,255,0.08)
Кнопки управления:

"Начать поиск": синяя кнопка #4F8EF7, полная ширина, borderRadius 12, height 48
"Стоп": красная #EF4444
"Обновить": синяя

Список устройств (deviceItem):
background: #1A1A26
borderRadius: 14
border: 1px solid rgba(255,255,255,0.07)
padding: 14
marginBottom: 8
Подключённое устройство:
background: rgba(79,142,247,0.08)
border: 1px solid rgba(79,142,247,0.35)
добавить тонкое синее свечение
Имя устройства: белый, bold
ID устройства: #475569, моноширинный шрифт, fontSize 10
RSSI бейдж:
background: rgba(79,142,247,0.15)
color: #4F8EF7
borderRadius: 6
fontSize: 11
fontWeight: 600
Кнопки подключить/отключить — заменить стандартный <Button> на <TouchableOpacity> с кастомным стилем:

Подключить: синий bg, белый текст, borderRadius 10
Отключить: красный bg, белый текст


ЭТАП 7 — TPMS МОНИТОР (src/components/TirePressureMonitor.tsx)
Modal:
background: #0F0F18
borderRadius: 28
padding: 24
Заголовок: белый bold, кнопка закрытия — круглая тёмная
Силуэт автомобиля:
background: #1E1E2E
borderRadius: 40
добавить тонкую рамку rgba(255,255,255,0.06)
Шины (tireCircle):
background: #0A0A0F
borderWidth: 3
при норме: borderColor #22C55E + shadow зелёный glow
при внимании: borderColor #F59E0B + shadow оранжевый
при опасности: borderColor #EF4444 + shadow красный + анимация pulse
нет данных: borderColor #334155
Значение давления:
при норме: color #22C55E
при внимании: color #F59E0B
при опасности: color #EF4444
нет данных: color #475569
Легенда:
каждый пункт в отдельной pill-капсуле
background: rgba(цвет, 0.1)
border: 1px solid rgba(цвет, 0.2)

ЭТАП 8 — АТМОСФЕРНАЯ ПОДСВЕТКА (src/screens/AmbientLightScreen.tsx)
Modal sheet:
background: #0F0F18
borderTopRadius: 30
Заголовок: белый, 800 weight
Кнопка питания:
ВЫКЛЮЧЕНА:
background: #1E1E2E
border: 1px solid rgba(255,255,255,0.1)
иконка и текст серые
ВКЛЮЧЕНА:
background: gradient от выбранного цвета к более тёмному
(имитировать через: rgba(selectedColor, 0.85) как bg + border selectedColor)
добавить shadow glow цветом выбранного цвета
Секции настроек:
background: #1A1A26
borderRadius: 20
border: 1px solid rgba(255,255,255,0.06)
Слайдер яркости:

Трек — градиент от тёмного к выбранному цвету
minimumTrackTintColor = selectedColor
maximumTrackTintColor = #1E1E2E
Кнопки пресетов 25/50/75/100 — тёмные, при активном — цвет акцента

Цветовые кнопки (colorButton):
aspectRatio: 1
width: ~30%
borderRadius: 18
shadow: цветное свечение при выбранном
при выборе: border 3px white + scale 1.08 + shadow glow
Индикатор текущего цвета:
background: rgba(выбранный цвет, 0.2)
border: 1px solid rgba(выбранный цвет, 0.4)
текст цвета — белый bold с тенью

ЭТАП 9 — TOAST (src/components/Toast.tsx)
background: #1E1E2E (базовый)
success: background rgba(34,197,94,0.15), border #22C55E, иконка ✓
error: background rgba(239,68,68,0.15), border #EF4444, иконка ✗
info: background rgba(79,142,247,0.15), border #4F8EF7, иконка ℹ

borderRadius: 16
border: 1px solid (цвет типа)
добавить backdrop blur (если платформа поддерживает)
текст белый, fontSize 14, fontWeight 500

ЭТАП 10 — ИНДИКАТОР СИГНАЛА (src/components/SignalStrength.tsx)
bars неактивные: #1E1E2E
bars активные при сильном (4): #22C55E
bars активные при среднем (2-3): #F59E0B
bars активные при слабом (0-1): #EF4444
текст rssi: #475569, fontSize 10

ОБЩИЕ ТРЕБОВАНИЯ КО ВСЕМ ФАЙЛАМ

Убрать все backgroundColor: '#fff', '#F8F9FA', 'white', '#f9f9f9'
Убрать все светлые color: '#333', '#555', '#666', '#999' — заменить на токены из палитры
Все <Button> из React Native заменить на <TouchableOpacity> с кастомными стилями
Все модальные окна: statusBarTranslucent={true} где применимо
Добавить StatusBar с barStyle="light-content" и backgroundColor="#0A0A0F"
Скроллируемые списки — showsVerticalScrollIndicator={false}
Все тени через elevation (Android) И shadowColor/Offset/Opacity/Radius (iOS)
Интерактивные элементы: activeOpacity={0.75} вместо дефолтных


АНИМАЦИИ (опционально, если не замедляют)

Pulse на зелёной точке статуса подключения (scale 1 → 1.3, opacity 1 → 0, loop)
FadeIn для карточек при появлении (уже есть в CarControls — сохранить)
Shimmer на кнопке двигателя в активном состоянии (opacity 0.8 → 1, loop медленный)


ЧТО НЕ ТРОГАТЬ

Вся бизнес-логика (хуки, BLE, команды)
Структура компонентов и пропсов
Типы TypeScript
Логика состояний (carState, tirePressure и т.д.)
Только StyleSheet и визуальные атрибуты JSX (цвета, размеры, отступы)