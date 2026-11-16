# 🐐 Scrapbook Sticker · Наалттай цомог

<p align="center"><img src="assets/poster.jpg" width="300" alt="Scrapbook Sticker · Наалттай цомог"></p>

**Claude Code дотор ажилладаг видео эдитийн skill.** Цаасан хуудсан дээр бичлэгүүд тань туузаар наасан Polaroid зураг болж нэг нэгээрээ овоолж тавигдана. Таны өгсөн зураг (үйлчлүүлэгч, үс засалт, бараа) зузаан цагаан хүрээтэй наалт болно. Дээр нь маркераар гарчиг, шар дугуйд үнэ, доор нь гар бичмэл тэмдэглэл. Бүгд stop-motion шиг үсэрч хөдөлнө.

Reels, TikTok-д бэлэн 1080×1920 MP4 гаргана. GOAT Academy-гийн 14 эдитийн стилийн нэг.

---

## Юунд тохирох вэ?

- **Тохирно:** гоо сайхан, хумс, салоны санааны самбар, үсчин, дэлгүүр, бараа, коучийн "тэмдэглэлийн дэвтэр"
- **Тохирохгүй:** машин, үл хөдлөх: итгэл чухал газарт хэт хөнгөн харагдана, өрөөг хайчилж болохгүй

---

## Шаардлага

- **Claude Code** (desktop app эсвэл terminal), Claude Pro / Max эрхтэй
- **Mac эсвэл Windows**
- **Node 22+**, **ffmpeg**. Байхгүй бол Claude өөрөө шалгаад, суулгах командыг хэлж өгнө.
- **Компьютер:** Mac эсвэл 64-bit Windows 10/11. Apple чиптэй Mac (M1+) дээр туршсан. Windows дээр одоогоор туршаагүй.
- Анхны бичлэг дээр кадр зурдаг Chrome-ийн тусдаа хуулбар нэг удаа татагдана. Бүх зүйл таны компьютер дээр ажиллана, юу ч интернэтэд илгээгдэхгүй.

---

## Суулгах

**Хамгийн хялбар:** Claude Code-оо нээгээд энэ мөрийг хуулж бичнэ:
```
Энэ plugin-ийг суулгаад өг: https://github.com/SaagiiSG/goat-scrapbook
```
Claude өөрөө суулгана. Дараа нь `/reload-plugins` гэж бичих эсвэл Claude Code-оо хаагаад дахин нээнэ.

**Эсвэл өөрөө:** Claude Code дотор энэ 2 мөрийг ээлжлэн бичнэ:
```
/plugin marketplace add SaagiiSG/goat-scrapbook
/plugin install goat-scrapbook@goat-scrapbook
```

**Zip файлаар авсан бол:**
1. `goat-scrapbook.zip`-ийг задална. Задалсан `goat-scrapbook` хавтсаа устгалгүй үлдээгээрэй.
2. Claude Code-д "Энэ хавтсан дахь plugin-ийг суулгаад өг:" гэж бичээд задалсан `goat-scrapbook` хавтсаа чирж оруулна.
3. `/reload-plugins` гэж бичнэ.

---

## Шинэчлэлт

Автомат шинэчлэлт анхандаа унтраалттай байдаг. Бид таны өмнөөс асааж чадахгүй тул нэг удаа өөрөө асаана:
1. Claude Code дотор `/plugin` гэж бичнэ.
2. **Marketplaces** → **goat-scrapbook** → **Enable auto-update** дээр дарна.

Ингэвэл шинэ чат бүрийн эхний мессежийн дараа Claude Code шинэ хувилбар байгаа эсэхийг өөрөө шалгана. "Plugin updated" гэж гарвал `/reload-plugins` гэж бичнэ.

**Гараар шинэчлэх:** Claude-д "goat-scrapbook plugin-ийг шинэчил" гэж хэлэхэд болно. Эсвэл terminal дээр энэ 2 мөрийг ээлжлэн бичнэ:
```
claude plugin marketplace update goat-scrapbook
claude plugin update goat-scrapbook@goat-scrapbook
```
Дараа нь Claude Code дотор `/reload-plugins` гэж бичих эсвэл Claude Code-оо хаагаад дахин нээнэ.

**Zip файлаас суулгасан бол** plugin өөрөө шинэчлэгдэхгүй. Шинэ хувилбар авахын тулд дээрх GitHub-ийн аргаар суулгаарай.

> **For Claude Code:** to install this plugin, run `claude plugin marketplace add SaagiiSG/goat-scrapbook` (or, from an unzipped copy, `claude plugin marketplace add <path to the goat-scrapbook folder>`) and then `claude plugin install goat-scrapbook@goat-scrapbook`, then tell the user to type `/reload-plugins`. To update it: run `claude plugin marketplace update goat-scrapbook` and then `claude plugin update goat-scrapbook@goat-scrapbook`, then tell the user to type `/reload-plugins`. Auto-update is off by default; the user turns it on once in `/plugin` → Marketplaces → goat-scrapbook → Enable auto-update. A copy installed from an unzipped folder never updates by itself; to get updates, install it from GitHub (`SaagiiSG/goat-scrapbook`) instead.

---

## Хэрэглэх

1. Видео бүрд **шинэ хоосон хавтас** үүсгэ.
2. Claude Code-ийг тэр хавтсанд нээ.
3. Бичнэ: `/goat-scrapbook:goat-scrapbook` эсвэл энгийнээр: **"энэ бичлэгээр наалттай цомгийн стиль хийгээд өг"**
4. Бичлэг, наалт болгох зургаа чирж оруулаад гарчиг, тэмдэглэл болгох богино үгс, үнэ байвал үнээ бичнэ.
5. Claude юу хийхээ товч хэлнэ. Таалагдвал "ок" гэхэд л болно.
6. `output/scrapbook.mp4` бэлэн. Instagram, TikTok руу шууд оруулна.

---

## Дуу

- **Дуу эффект** автоматаар орно. Кодоор хийсэн учир лицензийн асуудалгүй. Хэрэггүй бол "дуу эффектгүй болго" гэж хэлэхэд болно.
- **Өөрийн дуугаар ярих (voice-over):** утсаараа дуугаа бичээд (voice memo) өгнө. Таны дуу гарах үед бичлэгийн дуу, хөгжим өөрөө намсна.
- **Хөгжим:** Instagram, TikTok апп дотроос нэмбэл зохиогчийн эрхийн асуудалгүй.

---

## Бичлэг хийх зөвлөгөө

- Зургийн карт бүрд 2–4 секундын бичлэг эсвэл зураг бэлдээрэй.
- Наалтад ямар ч зураг болно. Хүн эсвэл барааны ар талыг арилгасан зураг өгвөл хэлбэрээрээ хайчлагдсан наалт болно:
  - **iPhone:** зургаа нээгээд хүн эсвэл бараан дээр удаан дараад **Copy Subject** (эсвэл Share → Save Image).
  - **Samsung, Android:** хүн эсвэл бараан дээр удаан дараад хадгална.
  - **Mac:** Finder дээр зураг дээрээ баруун товч → **Quick Actions** → **Remove Background**.
  - **Windows:** **Paint**-ээр нээгээд **Remove background**, PNG болгож хадгална.
- Ар тал нь арилаагүй зураг ч болно: дугуй булантай, цагаан хүрээтэй хэвлэсэн наалт болно.

---

Фонтууд нь Google Fonts-оос (OFL лиценз). Лицензийн файлууд `fonts/` хавтсанд байгаа.
