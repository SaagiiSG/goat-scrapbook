# 🐐 Scrapbook Sticker · Наалттай цомог

**Claude Code дотор ажилладаг видео эдитийн skill.** Таны үйлчлүүлэгч, үс засалт эсвэл бараа цагаан хүрээтэй наалт болж, цаасан хуудсан дээр туузаар наагдана. Хажууд нь гар бичмэл тэмдэглэл гарна.

Reels, TikTok-д бэлэн 1080×1920 MP4 гаргана. GOAT Academy-гийн 14 эдитийн стилийн нэг.

---

## Юунд тохирох вэ?

- **Тохирно:** гоо сайхан, хумс, салоны санааны самбар, үсчин, дэлгүүр, бараа, коучийн "тэмдэглэлийн дэвтэр"
- **Тохирохгүй:** машин, үл хөдлөх: итгэл чухал газарт хэт хөнгөн харагдана, өрөөг хайчилж болохгүй

---

## Шаардлага

- **Claude Code** (desktop app эсвэл terminal), Claude Pro / Max эрхтэй
- **Mac эсвэл Windows**
- **ffmpeg** болон **uv**. Байхгүй бол Claude өөрөө шалгаад, суулгах командыг хэлж өгнө.
- Анх удаа ажиллуулахад хайчлах загвар (~170 MB) нэг удаа татагдана.

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

**Шинэ хувилбар гарвал:** Claude-д "goat-scrapbook plugin-ийг шинэчил" гэж хэлэхэд болно.

> **For Claude Code:** to install this plugin, run `claude plugin marketplace add SaagiiSG/goat-scrapbook` (or, from an unzipped copy, `claude plugin marketplace add <path to the goat-scrapbook folder>`) and then `claude plugin install goat-scrapbook@goat-scrapbook`, then tell the user to type `/reload-plugins`. To update it: `claude plugin marketplace update goat-scrapbook` and then `claude plugin update goat-scrapbook@goat-scrapbook`.

---

## Хэрэглэх

1. Видео бүрд **шинэ хоосон хавтас** үүсгэ.
2. Claude Code-ийг тэр хавтсанд нээ.
3. Бичнэ: `/goat-scrapbook:goat-scrapbook` эсвэл энгийнээр: **"энэ бичлэгээр наалттай цомгийн стиль хийгээд өг"**
4. Бичлэгээ чирж оруулаад тэмдэглэл болгох богино үгс, үнэ байвал үнээ бичнэ.
5. Claude юу хийхээ товч хэлнэ. Таалагдвал "ок" гэхэд л болно.
6. `output/scrapbook.mp4` бэлэн. Instagram, TikTok руу шууд оруулна.

---

## Дуу

- **Дуу эффект** автоматаар орно. Кодоор хийсэн учир лицензийн асуудалгүй. Хэрэггүй бол "дуу эффектгүй болго" гэж хэлэхэд болно.
- **Өөрийн дуугаар ярих (voice-over):** утсаараа дуугаа бичээд (voice memo) өгнө. Таны дуу гарах үед бичлэгийн дуу, хөгжим өөрөө намсна.
- **Хөгжим:** Instagram, TikTok апп дотроос нэмбэл зохиогчийн эрхийн асуудалгүй.

---

## Бичлэг хийх зөвлөгөө

- Хүн эсвэл барааг цэвэр, энгийн дэвсгэрийн өмнө ав.
- Наалт болох мөчид 2 секунд хөдлөлгүй зогсоо.
- Толь, эмх замбараагүй дэвсгэр, үстэй ижил өнгийн хана хайчлалтыг эвдэнэ.

---

Фонтууд нь Google Fonts-оос (OFL лиценз). Лицензийн файлууд `fonts/` хавтсанд байгаа.
