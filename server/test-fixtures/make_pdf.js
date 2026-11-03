const fs = require("fs");
const path = require("path");

function sanitize(text) {
  return text.split("(").join("").split(")").join("").split("\\").join("");
}

function wrapLine(text, maxChars) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).trim().length > maxChars) {
      if (current) lines.push(current.trim());
      current = w;
    } else {
      current = (current + " " + w).trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

function buildPdf(pagesText) {
  const objects = [];
  const fontObjNum = 3;
  const firstPageObjNum = 4;
  const numPages = pagesText.length;

  objects[1] = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";

  const kids = [];
  for (let i = 0; i < numPages; i++) kids.push(`${firstPageObjNum + i * 2} 0 R`);
  objects[2] = `2 0 obj\n<< /Type /Pages /Kids [${kids.join(" ")}] /Count ${numPages} >>\nendobj\n`;

  objects[fontObjNum] = `${fontObjNum} 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`;

  for (let i = 0; i < numPages; i++) {
    const pageObjNum = firstPageObjNum + i * 2;
    const contentObjNum = pageObjNum + 1;
    const lines = wrapLine(sanitize(pagesText[i]), 80);

    const streamParts = ["BT", "/F1 12 Tf", "72 740 Td", "14 TL"];
    lines.forEach((line, idx) => {
      if (idx === 0) streamParts.push(`(${line}) Tj`);
      else streamParts.push(`T* (${line}) Tj`);
    });
    streamParts.push("ET");
    const streamContent = streamParts.join("\n");

    objects[pageObjNum] =
      `${pageObjNum} 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 ${fontObjNum} 0 R >> >> /MediaBox [0 0 612 792] /Contents ${contentObjNum} 0 R >>\nendobj\n`;
    objects[contentObjNum] =
      `${contentObjNum} 0 obj\n<< /Length ${Buffer.byteLength(streamContent, "latin1")} >>\nstream\n${streamContent}\nendstream\nendobj\n`;
  }

  const totalObjs = fontObjNum + numPages * 2;
  let out = "%PDF-1.4\n";
  const offsets = new Array(totalObjs + 1).fill(0);
  for (let n = 1; n <= totalObjs; n++) {
    offsets[n] = Buffer.byteLength(out, "latin1");
    out += objects[n];
  }
  const xrefStart = Buffer.byteLength(out, "latin1");
  out += `xref\n0 ${totalObjs + 1}\n`;
  out += "0000000000 65535 f \n";
  for (let n = 1; n <= totalObjs; n++) {
    out += `${String(offsets[n]).padStart(10, "0")} 00000 n \n`;
  }
  out += `trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return Buffer.from(out, "latin1");
}

function buildEmptyTextPdf() {
  let out = "%PDF-1.4\n";
  const objs = [];
  objs[1] = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  objs[2] = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  objs[3] = "3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << >> /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n";
  const stream = "";
  objs[4] = `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`;
  const offsets = [0, 0, 0, 0, 0];
  for (let n = 1; n <= 4; n++) {
    offsets[n] = Buffer.byteLength(out, "latin1");
    out += objs[n];
  }
  const xrefStart = Buffer.byteLength(out, "latin1");
  out += "xref\n0 5\n0000000000 65535 f \n";
  for (let n = 1; n <= 4; n++) out += `${String(offsets[n]).padStart(10, "0")} 00000 n \n`;
  out += `trailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(out, "latin1");
}

const dir = __dirname;

fs.writeFileSync(path.join(dir, "hop_dong_a.pdf"), buildPdf([
  "Hop dong A Trang 1. Dieu khoan thanh toan: ben B tra truoc 30 phan tram gia tri hop dong ngay sau khi ky, phan con lai 70 phan tram thanh toan trong vong 7 ngay sau khi nghiem thu ban giao.",
  "Hop dong A Trang 2. Dieu khoan bao mat va trach nhiem cac ben.",
  "Hop dong A Trang 3. Dieu khoan cham dut hop dong.",
]));

fs.writeFileSync(path.join(dir, "bao_gia_b.pdf"), buildPdf([
  "Bao gia B Trang 1. Dieu khoan thanh toan: khach hang thanh toan 100 phan tram ngay khi ky hop dong, khong chia nho dot thanh toan.",
]));

fs.writeFileSync(path.join(dir, "scan_no_text.pdf"), buildEmptyTextPdf());

fs.writeFileSync(path.join(dir, "fake.docx"), "not a real docx, just for file-type rejection test");

const bigBuf = Buffer.alloc(50 * 1024 * 1024 + 2048, 0x41);
fs.writeFileSync(path.join(dir, "oversize.pdf"), bigBuf);

console.log("done");
