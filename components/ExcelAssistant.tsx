
import React, { useState } from 'react';
import { generateExcelFormulas } from '../services/gemini';
import { Table, Loader2, Wand2, CheckCircle, FileSpreadsheet, Edit3, Save, AlertCircle } from 'lucide-react';
import { ExcelTemplate } from '../types';

export const ExcelAssistant: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'templates' | 'wizard'>('templates');
  
  // Standard Templates with AI Prompts
  const templates: ExcelTemplate[] = [
    {
      id: 'budget',
      name: 'Haushaltsbuch',
      description: 'Einfache Übersicht über Einnahmen, Fixkosten und variable Ausgaben.',
      headers: ['Datum', 'Kategorie', 'Beschreibung', 'Einnahme (€)', 'Ausgabe (€)', 'Saldo'],
      rows: [
        ['2024-01-01', 'Gehalt', 'Monatsgehalt', '2500', '', ''],
        ['2024-01-02', 'Miete', 'Warmmiete', '', '800', ''],
        ['2024-01-05', 'Lebensmittel', 'Wocheneinkauf', '', '150', ''],
      ],
      aiPrompt: "Erstelle Formeln für die Spalte 'Saldo'. Der Saldo sollte fortlaufend berechnet werden (Vorheriger Saldo + Einnahme - Ausgabe). Füge auch eine Summenzeile am Ende für Einnahmen und Ausgaben hinzu."
    },
    {
      id: 'project',
      name: 'Projektplan',
      description: 'Verfolgung von Aufgaben, Verantwortlichen und Fristen.',
      headers: ['Aufgabe', 'Verantwortlich', 'Startdatum', 'Enddatum', 'Status', 'Tage offen'],
      rows: [
        ['Konzept erstellen', 'Jette', '2024-02-01', '2024-02-05', 'Erledigt', ''],
        ['Design Entwurf', 'Chris', '2024-02-06', '2024-02-10', 'In Bearbeitung', ''],
        ['Entwicklung', 'Team', '2024-02-11', '2024-02-28', 'Offen', ''],
      ],
      aiPrompt: "Berechne die Spalte 'Tage offen' basierend auf dem Enddatum und dem heutigen Datum (angenommen HEUTE). Wenn der Status 'Erledigt' ist, soll dort 0 oder '-' stehen. Füge bedingte Formatierungshinweise für überfällige Aufgaben hinzu."
    },
    {
      id: 'loan',
      name: 'Darlehensrechner',
      description: 'Berechnung von Zinsen und Tilgung für Kredite.',
      headers: ['Monat', 'Restschuld Beginn', 'Rate', 'Zinsanteil', 'Tilgungsanteil', 'Restschuld Ende'],
      rows: [
        ['1', '10000', '200', '', '', ''],
        ['2', '', '200', '', '', ''],
      ],
      aiPrompt: "Erstelle die Formeln für einen Annuitätendarlehens-Tilgungsplan. Gehe von einem festen Zinssatz von 5% p.a. aus (oder mache ihn konfigurierbar in einer separaten Zelle). Berechne Zinsanteil, Tilgungsanteil und die neue Restschuld für jeden Monat."
    },
    {
      id: 'grades',
      name: 'Notenspiegel',
      description: 'Berechnung des Notendurchschnitts für Uni/Schule.',
      headers: ['Fach', 'Credits / Gewichtung', 'Note', 'Gewichtete Note'],
      rows: [
        ['Statistik', '5', '2.3', ''],
        ['Soziologie Grundlagen', '10', '1.7', ''],
        ['Methoden', '5', '3.0', ''],
      ],
      aiPrompt: "Berechne die 'Gewichtete Note' (Note * Credits). Erstelle am Ende eine Formel für den gewichteten Gesamtdurchschnitt (Summe Gewichtete Note / Summe Credits)."
    },
    {
      id: 'travel',
      name: 'Reisekosten',
      description: 'Erfassung von Ausgaben während einer Reise.',
      headers: ['Datum', 'Ort', 'Kategorie', 'Betrag (€)', 'Währung Orig.', 'Wechselkurs'],
      rows: [
        ['2024-06-15', 'Berlin', 'Hotel', '120', 'EUR', '1'],
        ['2024-06-15', 'London', 'Essen', '45', 'GBP', '1.18'],
      ],
      aiPrompt: "Berechne den Betrag in Euro, falls eine Fremdwährung genutzt wurde (Betrag * Wechselkurs). Gruppiere am Ende die Gesamtkosten nach Kategorie (Hotel, Essen, Transport)."
    },
    {
      id: 'inventory',
      name: 'Inventarliste',
      description: 'Verwaltung von Gegenständen, Mengen und Werten.',
      headers: ['Artikel', 'Menge', 'Einzelpreis', 'Gesamtwert', 'Lagerort', 'Nachbestellen?'],
      rows: [
        ['Druckerpapier', '50', '4.50', '', 'Regal A', ''],
        ['Kugelschreiber', '10', '0.80', '', 'Schublade 2', ''],
      ],
      aiPrompt: "Berechne den Gesamtwert (Menge * Einzelpreis). Fülle die Spalte 'Nachbestellen?' automatisch mit 'JA', wenn die Menge unter 20 fällt, sonst 'NEIN'."
    },
    {
      id: 'marketing',
      name: 'Marketing Plan',
      description: 'Planung von Social Media Posts und Kampagnen.',
      headers: ['Datum', 'Plattform', 'Content Typ', 'Thema', 'Status', 'Engagement', 'Score'],
      rows: [
        ['2024-03-01', 'Instagram', 'Reel', 'Produkt Launch', 'Geplant', '1200', ''],
        ['2024-03-03', 'LinkedIn', 'Text', 'Case Study', 'Idee', '500', ''],
      ],
      aiPrompt: "Berechne einen simplen 'Score' für das Engagement. Wenn Plattform Instagram ist, teile Engagement durch 100, bei LinkedIn durch 50. Zeige Trends an."
    }
  ];

  const [selectedTemplate, setSelectedTemplate] = useState<ExcelTemplate | null>(null);
  const [tableData, setTableData] = useState<{ headers: string[], rows: string[][] }>({ headers: [], rows: [] });
  const [formulas, setFormulas] = useState('');
  const [instructionText, setInstructionText] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const loadTemplate = (t: ExcelTemplate) => {
    setSelectedTemplate(t);
    // Deep copy to avoid mutating original
    setTableData({
      headers: [...t.headers],
      rows: t.rows.map(r => [...r])
    });
    setInstructionText(t.aiPrompt || "Analysiere diese Tabelle und füge hilfreiche Formeln hinzu.");
    setFormulas('');
    setValidationError('');
  };

  const handleGenerateFormulas = async () => {
    setValidationError('');
    
    // Validation Logic
    if (tableData.headers.length === 0 || tableData.rows.length === 0) {
        setValidationError("Die Tabelle darf nicht leer sein. Bitte füge Daten hinzu.");
        return;
    }
    if (!instructionText.trim()) {
        setValidationError("Bitte gib eine Anweisung für die KI ein.");
        return;
    }

    setLoading(true);
    try {
      const f = await generateExcelFormulas(
        `Vorlage: ${selectedTemplate?.name}. Anweisung: ${instructionText}`, 
        tableData
      );
      setFormulas(f || '');
    } catch (e) {
      console.error(e);
      setValidationError("Fehler bei der Generierung. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  };

  const updateCell = (rowIndex: number, colIndex: number, val: string) => {
    const newRows = [...tableData.rows];
    newRows[rowIndex][colIndex] = val;
    setTableData({ ...tableData, rows: newRows });
  };

  const updateHeader = (colIndex: number, val: string) => {
    const newHeaders = [...tableData.headers];
    newHeaders[colIndex] = val;
    setTableData({ ...tableData, headers: newHeaders });
  };

  const addRow = () => {
    const newRow = new Array(tableData.headers.length).fill('');
    setTableData({ ...tableData, rows: [...tableData.rows, newRow] });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="flex gap-2 bg-white p-1 rounded-2xl w-fit shadow-sm border border-slate-100">
        <button 
          onClick={() => setActiveMode('templates')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeMode === 'templates' ? 'bg-green-600 text-white shadow' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <FileSpreadsheet size={16} /> Vorlagen & Editor
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <Table className="text-green-600" />
          Excel Helfer
        </h3>

        {activeMode === 'templates' && (
          <div className="space-y-8">
            
            {/* Template Selection Grid */}
            {!selectedTemplate && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {templates.map(t => (
                        <div 
                            key={t.id} 
                            onClick={() => loadTemplate(t)}
                            className="border border-slate-200 rounded-2xl p-5 cursor-pointer hover:border-green-500 hover:bg-green-50/30 transition-all group"
                        >
                            <div className="flex items-start justify-between mb-2">
                                <h4 className="font-bold text-slate-700 group-hover:text-green-700">{t.name}</h4>
                                <FileSpreadsheet size={18} className="text-slate-300 group-hover:text-green-500" />
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">{t.description}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Editor Mode */}
            {selectedTemplate && (
                <div className="animate-in fade-in slide-in-from-right-4">
                    <div className="flex justify-between items-center mb-4">
                        <h4 className="text-lg font-bold text-slate-700 flex items-center gap-2">
                            <Edit3 size={18} className="text-green-600"/> 
                            Editor: {selectedTemplate.name}
                        </h4>
                        <button 
                            onClick={() => setSelectedTemplate(null)}
                            className="text-xs font-bold text-slate-500 hover:text-red-500 px-3 py-1 bg-slate-100 rounded-lg"
                        >
                            Schließen / Andere Vorlage
                        </button>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-xl mb-4 bg-white shadow-sm">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-xs">
                                <tr>
                                    {tableData.headers.map((h, i) => (
                                        <th key={i} className="px-2 py-2 min-w-[120px]">
                                            <input 
                                                value={h}
                                                onChange={(e) => updateHeader(i, e.target.value)}
                                                className="w-full bg-transparent border-b border-transparent focus:border-green-500 outline-none font-bold text-slate-600"
                                            />
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tableData.rows.map((row, rIndex) => (
                                    <tr key={rIndex} className="border-t border-slate-100 hover:bg-slate-50">
                                        {row.map((cell, cIndex) => (
                                            <td key={cIndex} className="p-1">
                                                <input 
                                                    value={cell} 
                                                    onChange={e => updateCell(rIndex, cIndex, e.target.value)}
                                                    className="w-full bg-transparent p-2 rounded hover:bg-white focus:bg-white focus:ring-2 focus:ring-green-500 outline-none transition-all text-slate-700"
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <button onClick={addRow} className="w-full py-2 text-xs font-bold text-slate-400 hover:bg-slate-50 hover:text-green-600 border-t border-slate-100 transition-colors">
                            + Zeile hinzufügen
                        </button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Anweisungen für die KI</label>
                            <textarea 
                                value={instructionText}
                                onChange={(e) => setInstructionText(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-green-500 outline-none min-h-[80px]"
                                placeholder="Beschreibe, welche Formeln erstellt werden sollen..."
                            />
                        </div>

                        {validationError && (
                            <div className="flex items-center gap-2 text-red-600 text-xs font-bold bg-red-50 p-3 rounded-lg">
                                <AlertCircle size={14} />
                                {validationError}
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <button 
                                onClick={handleGenerateFormulas} 
                                disabled={loading}
                                className="bg-green-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-700 transition-all flex items-center gap-2 shadow-lg shadow-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />}
                                Formeln & Analyse generieren
                            </button>
                        </div>
                    </div>

                    {formulas && (
                        <div className="mt-8 prose prose-sm max-w-none text-slate-700 bg-green-50/50 p-6 rounded-2xl border border-green-100 animate-in fade-in zoom-in-95">
                            <h4 className="font-bold text-green-800 flex items-center gap-2 mb-4">
                                <CheckCircle size={18} /> Ergebnis & Formeln
                            </h4>
                            <div className="whitespace-pre-wrap font-medium">{formulas}</div>
                        </div>
                    )}
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
