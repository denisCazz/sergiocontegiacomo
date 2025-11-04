import type { Article, EventItem } from './cms';

export const sampleArticles: Article[] = [
  {
    title: "Come costruire una strategia patrimoniale resiliente",
    slug: "strategia-patrimoniale-resiliente",
    publishedAt: "2024-10-10",
    author: "Sergio Contegiacomo",
  coverImage: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "Linee guida pratiche per valutare il proprio patrimonio e proteggerlo da volatilita' improvvise dei mercati.",
    content: "",
    tags: ["patrimonio", "pianificazione"],
  },
  {
    title: "Abitudini finanziarie per imprenditori consapevoli",
    slug: "abitudini-finanziarie-imprenditori",
    publishedAt: "2024-09-15",
    author: "Sergio Contegiacomo",
  coverImage: "https://images.unsplash.com/photo-1483104879057-379b6c2fe5a3?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "Le cinque routine che mantengono in equilibrio liquidita', crescita e serenita' personale.",
    content: "",
    tags: ["coaching", "finanza-personale"],
  },
  {
    title: "Family office: quando e perche' farvi ricorso",
    slug: "family-office-quando",
    publishedAt: "2024-08-20",
    author: "Sergio Contegiacomo",
  coverImage: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=1200&q=80",
    excerpt:
      "Un quadro chiaro delle soglie patrimoniali e organizzative per considerare una struttura dedicata.",
    content: "",
    tags: ["family-office", "wealth-management"],
  },
];

export const sampleEvents: EventItem[] = [
  {
    title: "Private Finance Lab - Milano",
    slug: "private-finance-lab-milano",
    date: "2025-02-15",
    time: "18:30",
    location: "Milano, Centro Congressi",
  coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
    description:
      "Workshop esclusivo su pianificazione patrimoniale evoluta per imprenditori e professionisti con focus su diversificazione.",
    price: "Ingresso su invito",
    status: "upcoming",
    tags: ["workshop", "milano"],
  },
  {
    title: "Webinar: Gli errori piu' comuni nella gestione della liquidita'",
    slug: "webinar-errori-gestione-liquidita",
    date: "2024-12-05",
    time: "12:00",
    location: "Online",
  coverImage: "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80",
    description:
      "Sessione online dedicata agli imprenditori per individuare e correggere i bias decisionali nella gestione della liquidita'.",
    price: "Gratuito con registrazione",
    status: "upcoming",
    tags: ["webinar", "liquidita"],
  },
  {
    title: "Percorso Executive: Finanza consapevole",
    slug: "percorso-executive-finanza-consapevole",
    date: "2024-06-25",
    time: "09:30",
    location: "Roma, Palazzo dei Congressi",
  coverImage: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80",
    description:
      "Programme intensivo di due giornate per team executive che desiderano costruire processi decisionali piu' solidi.",
    price: "1.200 EUR + IVA",
    status: "past",
    tags: ["roma", "executive"],
  },
];
