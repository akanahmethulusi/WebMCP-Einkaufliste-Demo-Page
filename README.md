# WebMCP


## Interaktive Webanwendungen, die die WebMCP-Integration (Web Model Context Protocol) demonstrieren. Jede Anwendung läuft unabhängig – WebMCP erweitert die KI-Agenten um programmatische Steuerung.

Interaktive Webanwendungen, die die WebMCP-Integration (Web Model Context Protocol) demonstrieren. Jede Anwendung läuft unabhängig – WebMCP erweitert die KI-Agenten um programmatische Steuerung.

Mit dem Aufkommen generativer KI durchsucht diese nun Webseiten in unserem Namen, fasst lange Texte zusammen, kauft bei Amazon ein und bucht Tickets. Sind Webseiten jedoch zu komplex, stößt sie an ihre Grenzen. Viele KI-Systeme, die Webbrowser nutzen, arbeiten nämlich mit Screenshots des Browserfensters und analysieren dessen Koordinaten. 
Natürlich gibt es auch andere Ansätze. 

Beispielsweise erstellt die Cloud eine Liste der Objekte im Seitencode und navigiert entsprechend. Andere Anwendungen versuchen, die Vorgänge direkt im Seitencode zu verstehen. 

Fakt ist jedoch: Je komplexer die Seitenstruktur, desto schwieriger wird die Nutzung von Webseiten für KI-Systeme. Webseiten sind für Menschen konzipiert. Nicht-menschliche Nutzer haben Schwierigkeiten damit. 
Aus diesem Grund wurde Web MCP (Multi-Control-Processing) eingeführt. Ziel ist es, Webseiten der menschlichen Kontrolle zu entziehen und KI zu ermöglichen, alle Funktionen unabhängig vom Seitendesign zu nutzen, ohne zu wissen, wo sich Suchfeld oder Schaltflächen befinden.

Wie bereits erwähnt, war die wichtigste Entwicklung in diesem Zusammenhang Googles Ankündigung, dass der Chrome-Browser das Web-MCP-Protokoll direkt unterstützt. Chrome unterstützt Web-MCP ab Version 146. Angesichts der Bedeutung von Webseiten in unserem Alltag werden wir den Namen Web-MCP in den kommenden Tagen deutlich häufiger hören. Ihnen ist vielleicht das Konzept eines MCP-Servers bekannt. Da Web-MCP eine Weiterentwicklung davon ist, möchte ich für diejenigen, die damit noch nicht vertraut sind, kurz erläutern, woher dieses Konzept stammt. So können Sie besser nachvollziehen, welch wichtigen Schritt Web-MCP darstellt.

In diesem App erläutern wir den Datenaustausch von der API über MCP bis hin zu WebMCP.

## So führen Sie das Programm aus:
Ein lokaler HTTP-Server ist erforderlich (file://-URLs funktionieren nicht – WebMCP benötigt eine sichere Verbindung).

# Node.js
npx http-server .

Öffnen Sie http://localhost:8000 in Ihrem Browser.

## Das Szenario ist folgendes: 
Beim Einkaufen möchte ich den Supermarkt mit den günstigsten Produkten nutzen. Jeder Supermarkt hat also seinen eigenen Warenkorb innerhalb dieser einen Benutzeroberfläche. Und ich kann in jedem Supermarkt separat suchen. 
Wir gehen natürlich davon aus, dass die Supermärkte das WebMCP-Protokoll in ihre Suchseiten integriert haben. WebMCP hat eine Besonderheit: Man kann nicht remote darauf zugreifen. Die Seite muss physisch geöffnet sein. Das ist eine Sicherheitsmaßnahme. Sie müssen die Seite hier sehen können. Deshalb simuliere ich, als ob die Seite in einem Browser geöffnet wäre und ich von dort aus suche.

## Einkaufsliste für mehrere Märkte (markt.html)
Eine Einkaufsliste für mehrere Märkte mit Super-App-Architektur. Unteranwendungen (markts/markt1-3.html) laufen in einem iFrame und registrieren ihre Tools über postMessage bei der Hauptanwendung.

TOOL	            BESCHREIBUNG	                              PARAMETER
add_item	        Artikel hinzufügen 	                        name, store
move_item	        Artikel in einen anderen Markt verschieben	name, store
remove_item	      Artikel entfernen	                          name
update_item	      Artikel aktualisieren	                      name, new_name
get_market_state	Gesamte Liste abrufen	                      --

## Architektur
- Polyfill: Anwendungen laden das Polyfill `@mcp-b/global`. Chrome funktioniert auch ohne Polyfill, sofern native WebMCP-Unterstützung verfügbar ist.
- Tool-Registrierung: Erfolgt mit `navigator.modelContext.registerTool()`.
- Super-App: Sammelt Tools der Unteranwendung market.html über postMessage (WEBMCP_REGISTER_TOOL → WEBMCP_EXECUTE_TOOL → WEBMCP_TOOL_RESULT).
- Deklarative API: `declarative-polyfill.js` konvertiert <form>-Elemente mit dem Attribut `toolname` automatisch in WebMCP-Tools.
- Status: Alle Anwendungen verwenden ein einfaches Statusobjekt im Arbeitsspeicher; es gibt keine persistente Speicherung.

