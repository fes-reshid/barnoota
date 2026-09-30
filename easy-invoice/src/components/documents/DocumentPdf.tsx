import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import { formatMoney } from "../../lib/money";
import { documentTitle, type DocumentView } from "../../lib/docView";

const BRAND = "#16a34a";
const INK = "#1e293b";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 9.5, color: INK, fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 16, marginBottom: 16 },
  logo: { width: 44, height: 44, borderRadius: 6, marginRight: 10 },
  businessName: { fontSize: 13, fontWeight: 700, marginBottom: 2 },
  muted: { color: MUTED, fontSize: 8.5, marginBottom: 1 },
  title: { fontSize: 18, fontWeight: 700, color: BRAND, textTransform: "uppercase", textAlign: "right" },
  docNumber: { fontSize: 9.5, color: MUTED, textAlign: "right", marginTop: 2 },
  statusLabel: { fontSize: 8, color: MUTED, textAlign: "right", marginTop: 6, textTransform: "uppercase" },
  metaRow: { flexDirection: "row", marginBottom: 16, gap: 24 },
  metaCol: { flex: 1 },
  metaLabel: { fontSize: 7.5, color: MUTED, textTransform: "uppercase", marginBottom: 3 },
  metaValue: { fontSize: 9.5, marginBottom: 1 },
  table: { marginTop: 4 },
  tableHeaderRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: BORDER, paddingBottom: 6, marginBottom: 4 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: BORDER, paddingVertical: 6 },
  th: { fontSize: 7.5, color: MUTED, textTransform: "uppercase" },
  colDesc: { flex: 4 },
  colQty: { flex: 1, textAlign: "right" },
  colPrice: { flex: 1.4, textAlign: "right" },
  colDiscount: { flex: 1.4, textAlign: "right" },
  colAmount: { flex: 1.4, textAlign: "right" },
  totalsBlock: { alignSelf: "flex-end", width: 220, marginTop: 12 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  totalsRowFinal: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: BORDER, paddingTop: 6, marginTop: 4 },
  totalsLabel: { color: MUTED },
  totalsLabelFinal: { fontSize: 11, fontWeight: 700 },
  totalsValueFinal: { fontSize: 11, fontWeight: 700 },
  balanceRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  balanceLabel: { fontSize: 10, fontWeight: 700, color: BRAND },
  balanceValue: { fontSize: 10, fontWeight: 700, color: BRAND },
  panel: { backgroundColor: "#f0fdf4", borderRadius: 6, padding: 10, marginTop: 20 },
  panelTitle: { fontSize: 8, fontWeight: 700, color: "#166534", textTransform: "uppercase", marginBottom: 4 },
  panelText: { fontSize: 8.5, color: "#166534", lineHeight: 1.4 },
  notes: { marginTop: 12 },
  notesTitle: { fontSize: 7.5, color: MUTED, textTransform: "uppercase", marginBottom: 3 },
  notesText: { fontSize: 8.5, color: MUTED, lineHeight: 1.4 },
  footer: { position: "absolute", bottom: 20, left: 36, right: 36, textAlign: "center", fontSize: 7.5, color: MUTED },
});

function fmtAddressLines(a: { line1: string; line2: string; city: string; state: string; postcode: string; country: string }): string[] {
  const lines = [a.line1, a.line2].filter(Boolean);
  const cityLine = [a.city, a.state, a.postcode].filter(Boolean).join(" ");
  if (cityLine) lines.push(cityLine);
  if (a.country && a.country !== "Australia") lines.push(a.country);
  return lines;
}

export function DocumentPdf({ doc }: { doc: DocumentView }) {
  const title = documentTitle(doc.kind, doc.business.gstRegistered);
  const gstLabel = doc.business.gstRegistered ? "GST" : "Tax";

  return (
    <Document title={`${title} ${doc.documentNumber}`}>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.headerRow}>
          <View style={{ flexDirection: "row" }}>
            {doc.business.logoUrl && <Image src={doc.business.logoUrl} style={styles.logo} />}
            <View>
              <Text style={styles.businessName}>{doc.business.name || "Your business"}</Text>
              {doc.business.abn && <Text style={styles.muted}>ABN {doc.business.abn}</Text>}
              {fmtAddressLines(doc.business.address).map((l, i) => (
                <Text key={i} style={styles.muted}>
                  {l}
                </Text>
              ))}
              {doc.business.email && <Text style={styles.muted}>{doc.business.email}</Text>}
              {doc.business.phone && <Text style={styles.muted}>{doc.business.phone}</Text>}
            </View>
          </View>
          <View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.docNumber}>{doc.documentNumber}</Text>
            <Text style={styles.statusLabel}>{doc.statusLabel}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Bill to</Text>
            <Text style={styles.metaValue}>{doc.customer.name || "—"}</Text>
            {doc.customer.contactPerson && <Text style={styles.muted}>Attn: {doc.customer.contactPerson}</Text>}
            {fmtAddressLines(doc.customer.billingAddress).map((l, i) => (
              <Text key={i} style={styles.muted}>
                {l}
              </Text>
            ))}
            {doc.customer.abn && <Text style={styles.muted}>ABN {doc.customer.abn}</Text>}
          </View>
          <View style={styles.metaCol}>
            <Text style={styles.metaLabel}>Issue date</Text>
            <Text style={styles.metaValue}>{doc.issueDate}</Text>
            <Text style={[styles.metaLabel, { marginTop: 6 }]}>{doc.secondDateLabel}</Text>
            <Text style={styles.metaValue}>{doc.secondDate}</Text>
          </View>
          {doc.poNumber ? (
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Reference / PO</Text>
              <Text style={styles.metaValue}>{doc.poNumber}</Text>
            </View>
          ) : (
            <View style={styles.metaCol} />
          )}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.colDesc]}>Description</Text>
            <Text style={[styles.th, styles.colQty]}>Qty</Text>
            <Text style={[styles.th, styles.colPrice]}>Unit price</Text>
            <Text style={[styles.th, styles.colDiscount]}>Discount</Text>
            <Text style={[styles.th, styles.colAmount]}>Amount</Text>
          </View>
          {doc.lineItems.map((li) => (
            <View style={styles.tableRow} key={li.id} wrap={false}>
              <Text style={styles.colDesc}>{li.description || "—"}</Text>
              <Text style={styles.colQty}>{li.quantity}</Text>
              <Text style={styles.colPrice}>{formatMoney(li.unitPriceCents, doc.currency)}</Text>
              <Text style={styles.colDiscount}>{li.discountCents > 0 ? formatMoney(li.discountCents, doc.currency) : "—"}</Text>
              <Text style={styles.colAmount}>{formatMoney(li.totalCents, doc.currency)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBlock} wrap={false}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>Subtotal</Text>
            <Text>{formatMoney(doc.subtotalCents, doc.currency)}</Text>
          </View>
          {doc.discountTotalCents > 0 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Discount</Text>
              <Text>-{formatMoney(doc.discountTotalCents, doc.currency)}</Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>{gstLabel}</Text>
            <Text>{formatMoney(doc.taxTotalCents, doc.currency)}</Text>
          </View>
          <View style={styles.totalsRowFinal}>
            <Text style={styles.totalsLabelFinal}>Total</Text>
            <Text style={styles.totalsValueFinal}>{formatMoney(doc.totalCents, doc.currency)}</Text>
          </View>
          {typeof doc.amountPaidCents === "number" && (
            <>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>Amount paid</Text>
                <Text>-{formatMoney(doc.amountPaidCents, doc.currency)}</Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Balance due</Text>
                <Text style={styles.balanceValue}>{formatMoney(doc.balanceDueCents ?? 0, doc.currency)}</Text>
              </View>
            </>
          )}
        </View>

        {doc.paymentInstructions && (
          <View style={styles.panel} wrap={false}>
            <Text style={styles.panelTitle}>Payment instructions</Text>
            <Text style={styles.panelText}>{doc.paymentInstructions}</Text>
            {doc.business.bank.bsb && (
              <Text style={[styles.panelText, { marginTop: 4 }]}>
                {doc.business.bank.bankName} · {doc.business.bank.accountName} · BSB {doc.business.bank.bsb} · Acc {doc.business.bank.accountNumber}
              </Text>
            )}
          </View>
        )}

        {doc.notes && (
          <View style={styles.notes} wrap={false}>
            <Text style={styles.notesTitle}>Notes</Text>
            <Text style={styles.notesText}>{doc.notes}</Text>
          </View>
        )}

        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `${doc.documentNumber} · Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
