import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const months = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export async function exportToExcel(services) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reporte Financiero');

  // Configuración general: Ocultar líneas de cuadrícula y congelar panel superior
  worksheet.views = [{ showGridLines: false, state: 'frozen', ySplit: 4 }];

  // Título Principal Minimalista
  worksheet.mergeCells('A1:E2');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = 'REPORTE FINANCIERO - SERVITRACK';
  titleCell.font = {
    name: 'Inter',
    size: 22,
    bold: true,
    color: { argb: 'FF0F172A' },
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };

  // Subtítulo con fecha
  worksheet.mergeCells('A3:E3');
  const subtitleCell = worksheet.getCell('A3');
  const dateStr = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  subtitleCell.value = `Generado el: ${dateStr}`;
  subtitleCell.font = {
    name: 'Inter',
    size: 10,
    italic: true,
    color: { argb: 'FF64748B' },
  };
  subtitleCell.alignment = { vertical: 'top', horizontal: 'left', indent: 2 };
  subtitleCell.border = {
    bottom: { style: 'medium', color: { argb: 'FFE2E8F0' } },
  };

  // Configuración de Columnas
  worksheet.columns = [
    { key: 'month', width: 20 },
    { key: 'type', width: 25 },
    { key: 'name', width: 50 },
    { key: 'status', width: 30 },
    { key: 'amount', width: 22 },
  ];

  // Encabezados de Tabla (Modernos y Oscuros)
  const headerRow = worksheet.addRow([
    'MES',
    'CATEGORÍA',
    'DETALLE',
    'ESTADO',
    'IMPORTE',
  ]);
  headerRow.height = 35;
  headerRow.eachCell((cell) => {
    cell.font = {
      name: 'Inter',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0F172A' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FF3B82F6' } } };
  });

  let totalYearExpenses = 0;
  let totalYearIncomes = 0;

  months.forEach((monthName, mIndex) => {
    const itemsInMonth = services.filter((s) => s.paymentMonth === mIndex);
    if (itemsInMonth.length > 0) {
      let monthExpensesTotal = 0;
      let monthIncomesTotal = 0;
      let isAlternate = false;

      itemsInMonth.forEach((item) => {
        let typeFriendly = '';
        if (item.type === 'income') typeFriendly = 'Ingreso / Sueldo';
        else if (item.type === 'loan') typeFriendly = 'Cuota / Préstamo';
        else if (item.type === 'overdue') typeFriendly = 'Deuda Atrasada';
        else typeFriendly = 'Gasto Regular';

        let statusFriendly = '';
        if (item.type === 'income') statusFriendly = 'INGRESO REGISTRADO';
        else statusFriendly = item.isPaid ? '✔ PAGADO' : '⚠ PENDIENTE';

        let nameWithDetails = item.name;
        if (item.type === 'loan') {
          nameWithDetails += ` (Acreedor: ${item.creditor || 'N/A'})`;
        } else if (item.type !== 'income') {
          let consText = `Consumo: ${months[item.consumptionMonth]}`;
          if (
            item.consumptionMonthEnd !== null &&
            item.consumptionMonthEnd !== undefined &&
            item.consumptionMonthEnd !== item.consumptionMonth
          ) {
            consText += ` - ${months[item.consumptionMonthEnd]}`;
          }
          nameWithDetails += ` [${consText}]`;
        }

        const itemRow = worksheet.addRow({
          month: monthName.toUpperCase(),
          type: typeFriendly,
          name: nameWithDetails,
          status: statusFriendly,
          amount: item.amount,
        });

        itemRow.height = 25;
        isAlternate = !isAlternate;

        itemRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          cell.font = { name: 'Inter', size: 11, color: { argb: 'FF334155' } };
          cell.alignment = {
            vertical: 'middle',
            horizontal:
              colNumber === 5 ? 'right' : colNumber === 4 ? 'center' : 'left',
            indent: 1,
          };
          cell.border = {
            bottom: { style: 'thin', color: { argb: 'FFF1F5F9' } },
          };

          // Zebra striping suave
          if (isAlternate) {
            cell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFF8FAFC' },
            };
          }
        });

        itemRow.getCell('amount').numFmt = '"$"#,##0.00';

        // Color de estado
        const statusCell = itemRow.getCell('status');
        statusCell.font = {
          name: 'Inter',
          size: 10,
          bold: true,
          color:
            item.type === 'income'
              ? { argb: 'FF0EA5E9' }
              : item.isPaid
                ? { argb: 'FF10B981' }
                : { argb: 'FFEF4444' },
        };

        if (item.type === 'income') {
          monthIncomesTotal += item.amount;
          totalYearIncomes += item.amount;
        } else {
          monthExpensesTotal += item.amount;
          totalYearExpenses += item.amount;
        }
      });

      // --- Resumen del Mes ---
      worksheet.addRow([]); // Espacio en blanco sutil

      // Gastos
      const expRow = worksheet.addRow([
        '',
        '',
        '',
        `Total Gastos (${monthName})`,
        monthExpensesTotal,
      ]);
      expRow.height = 22;
      expRow.getCell(4).font = {
        name: 'Inter',
        size: 11,
        bold: true,
        color: { argb: 'FF64748B' },
      };
      expRow.getCell(4).alignment = { horizontal: 'right' };
      expRow.getCell(5).font = {
        name: 'Inter',
        size: 11,
        bold: true,
        color: { argb: 'FFEF4444' },
      };
      expRow.getCell(5).numFmt = '"$"#,##0.00';

      // Ingresos
      const incRow = worksheet.addRow([
        '',
        '',
        '',
        `Total Ingresos (${monthName})`,
        monthIncomesTotal,
      ]);
      incRow.height = 22;
      incRow.getCell(4).font = {
        name: 'Inter',
        size: 11,
        bold: true,
        color: { argb: 'FF64748B' },
      };
      incRow.getCell(4).alignment = { horizontal: 'right' };
      incRow.getCell(5).font = {
        name: 'Inter',
        size: 11,
        bold: true,
        color: { argb: 'FF10B981' },
      };
      incRow.getCell(5).numFmt = '"$"#,##0.00';

      // Balance
      const balRow = worksheet.addRow([
        '',
        '',
        '',
        'BALANCE MENSUAL',
        monthIncomesTotal - monthExpensesTotal,
      ]);
      balRow.height = 28;
      balRow.getCell(4).font = {
        name: 'Inter',
        size: 12,
        bold: true,
        color: { argb: 'FF0F172A' },
      };
      balRow.getCell(4).alignment = { horizontal: 'right', vertical: 'middle' };

      const balCell = balRow.getCell(5);
      balCell.font = {
        name: 'Inter',
        size: 12,
        bold: true,
        color: {
          argb:
            monthIncomesTotal - monthExpensesTotal >= 0
              ? 'FF0F172A'
              : 'FFEF4444',
        },
      };
      balCell.numFmt = '"$"#,##0.00';
      balCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF1F5F9' },
      };
      balCell.border = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'medium', color: { argb: 'FFCBD5E1' } },
      };

      worksheet.addRow([]); // Espacio antes del siguiente mes
    }
  });

  // --- Gran Resumen Anual ---
  worksheet.addRow([]);
  const summaryHeader = worksheet.addRow(['', '', 'RESUMEN ANUAL', '', '']);
  worksheet.mergeCells(`C${summaryHeader.number}:E${summaryHeader.number}`);
  summaryHeader.height = 30;
  summaryHeader.getCell(3).font = {
    name: 'Inter',
    size: 14,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };
  summaryHeader.getCell(3).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' },
  };
  summaryHeader.getCell(3).alignment = {
    horizontal: 'center',
    vertical: 'middle',
  };

  const sumExp = worksheet.addRow([
    '',
    '',
    'Total Gastos del Año',
    '',
    totalYearExpenses,
  ]);
  worksheet.mergeCells(`C${sumExp.number}:D${sumExp.number}`);
  sumExp.height = 25;
  sumExp.getCell(3).font = {
    name: 'Inter',
    size: 12,
    bold: true,
    color: { argb: 'FF64748B' },
  };
  sumExp.getCell(5).font = {
    name: 'Inter',
    size: 12,
    bold: true,
    color: { argb: 'FFEF4444' },
  };
  sumExp.getCell(5).numFmt = '"$"#,##0.00';
  sumExp.eachCell({ includeEmpty: true }, (c, col) => {
    if (col >= 3)
      c.border = {
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
  });

  const sumInc = worksheet.addRow([
    '',
    '',
    'Total Ingresos del Año',
    '',
    totalYearIncomes,
  ]);
  worksheet.mergeCells(`C${sumInc.number}:D${sumInc.number}`);
  sumInc.height = 25;
  sumInc.getCell(3).font = {
    name: 'Inter',
    size: 12,
    bold: true,
    color: { argb: 'FF64748B' },
  };
  sumInc.getCell(5).font = {
    name: 'Inter',
    size: 12,
    bold: true,
    color: { argb: 'FF10B981' },
  };
  sumInc.getCell(5).numFmt = '"$"#,##0.00';
  sumInc.eachCell({ includeEmpty: true }, (c, col) => {
    if (col >= 3)
      c.border = {
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
  });

  const sumBal = worksheet.addRow([
    '',
    '',
    'BALANCE FINAL',
    '',
    totalYearIncomes - totalYearExpenses,
  ]);
  worksheet.mergeCells(`C${sumBal.number}:D${sumBal.number}`);
  sumBal.height = 35;
  sumBal.getCell(3).font = {
    name: 'Inter',
    size: 14,
    bold: true,
    color: { argb: 'FF0F172A' },
  };
  sumBal.getCell(3).alignment = { vertical: 'middle' };
  sumBal.getCell(5).font = {
    name: 'Inter',
    size: 14,
    bold: true,
    color: { argb: 'FFFFFFFF' },
  };
  sumBal.getCell(5).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' },
  };
  sumBal.getCell(5).numFmt = '"$"#,##0.00';
  sumBal.getCell(5).alignment = { vertical: 'middle' };
  sumBal.eachCell({ includeEmpty: true }, (c, col) => {
    if (col >= 3)
      c.border = {
        bottom: { style: 'medium', color: { argb: 'FF0F172A' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, 'Reporte_Financiero_Premium.xlsx');
}

export async function importFromExcel(file, currentServices) {
  return new Promise((resolve, reject) => {
    if (file && file.size > 2 * 1024 * 1024) {
      reject(new Error('El archivo excede el tamaño máximo permitido de 2MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target.result;
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.getWorksheet(1);

        const newImportedItems = [];
        let headerFound = false;
        let headerMap = { month: 1, type: 2, name: 3, status: 4, amount: 5 }; // fallback

        worksheet.eachRow((row) => {
          if (!headerFound) {
            let matches = 0;
            row.eachCell((cell, colNumber) => {
              const txt = (cell.text || '').toLowerCase();
              if (txt.includes('mes')) {
                headerMap.month = colNumber;
                matches++;
              } else if (
                txt.includes('tipo') ||
                txt.includes('categoría') ||
                txt.includes('categoria')
              ) {
                headerMap.type = colNumber;
                matches++;
              } else if (
                txt.includes('nombre') ||
                txt.includes('servicio') ||
                txt.includes('detalle')
              ) {
                headerMap.name = colNumber;
                matches++;
              } else if (
                txt.includes('estado') ||
                txt.includes('pagado') ||
                txt.includes('situación') ||
                txt.includes('situacion')
              ) {
                headerMap.status = colNumber;
                matches++;
              } else if (
                txt.includes('monto') ||
                txt.includes('valor') ||
                txt.includes('importe')
              ) {
                headerMap.amount = colNumber;
                matches++;
              }
            });
            if (matches >= 3) {
              headerFound = true;
              return;
            }
          }

          if (!headerFound) return;

          const monthText = row.getCell(headerMap.month).text;
          if (
            !monthText ||
            monthText.toUpperCase().includes('TOTAL') ||
            monthText.toUpperCase().includes('SUBTOTAL')
          )
            return;

          const cleanMonthText = monthText.trim();
          const monthIndex = months.findIndex(
            (m) => m.toLowerCase() === cleanMonthText.toLowerCase()
          );
          if (monthIndex === -1) return;

          const typeText = headerMap.type
            ? row.getCell(headerMap.type).text
            : 'Servicio';
          const nameText = row.getCell(headerMap.name).text;
          const statusText = row.getCell(headerMap.status).text;

          let amountRaw = row.getCell(headerMap.amount).value;
          if (
            amountRaw &&
            typeof amountRaw === 'object' &&
            amountRaw.result !== undefined
          ) {
            amountRaw = amountRaw.result;
          }
          const amount =
            parseFloat(amountRaw) ||
            parseFloat(
              row.getCell(headerMap.amount).text.replace(/[^0-9.-]+/g, '')
            ) ||
            0;

          if (!nameText || amount <= 0) return;

          const isLoan =
            typeText.toLowerCase().includes('préstamo') ||
            typeText.toLowerCase().includes('cuota');
          const isOverdue =
            typeText.toLowerCase().includes('atrasada') ||
            typeText.toLowerCase().includes('atrasado');
          const isIncome =
            typeText.toLowerCase().includes('ingreso') ||
            typeText.toLowerCase().includes('sueldo');
          let parsedName = nameText;
          let creditor = '';

          if (isLoan && nameText.includes('(')) {
            const parts = nameText.split('(');
            parsedName = parts[0].trim();
            creditor = parts[1].replace(')', '').trim();
          }

          // Check if item already exists in the local state list to avoid importing duplicates
          const existsInCurrent = currentServices.some(
            (s) =>
              s.paymentMonth === monthIndex &&
              s.name.toLowerCase() === parsedName.toLowerCase()
          );

          const existsInImported = newImportedItems.some(
            (s) =>
              s.paymentMonth === monthIndex &&
              s.name.toLowerCase() === parsedName.toLowerCase()
          );

          if (!existsInCurrent && !existsInImported) {
            newImportedItems.push({
              type: isIncome
                ? 'income'
                : isLoan
                  ? 'loan'
                  : isOverdue
                    ? 'overdue'
                    : 'service',
              name: parsedName,
              amount: amount,
              paymentMonth: monthIndex,
              isPaid: isIncome
                ? false
                : statusText.toLowerCase().includes('pagad') ||
                  statusText.toLowerCase() === 'si' ||
                  statusText.includes('✔'),
              consumptionMonth: isIncome ? null : monthIndex,
              consumptionMonthEnd: null,
              creditor: creditor,
              currentInstallment: 1,
              totalInstallments: 1,
            });
          }
        });

        resolve(newImportedItems);
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}
