export const researchContent = {
  kicker: ['02 / Our focus', 'From questions to understanding'],
  title: ['The work.', 'The bigger picture.'],
  summary: ['Six connected areas.', 'One shared purpose: public health.'],
  areas: [
    [
      'Pathogen Genomics',
      'Understanding the genetic signatures of the organisms that affect our communities.',
      'Explore how genome comparison helps characterize pathogens and their relationships.',
    ],
    [
      'Genomic Surveillance',
      'Connecting genomic evidence across time and place.',
      'Sequencing can help reveal emerging patterns and support ongoing public health surveillance.',
    ],
    [
      'Bioinformatics Pipelines',
      'Turning complex analyses into clear, reproducible processes.',
      'Computational pipelines bring quality checks, analysis, and reporting into a consistent workflow.',
    ],
    [
      'Sequence Analysis',
      'Finding meaningful signals in the language of life.',
      'From sequence quality to genetic variation, careful analysis makes genomic data interpretable.',
    ],
    [
      'Public Health Informatics',
      'Bringing biological insight into a broader public health context.',
      'Integrating information helps connect laboratory findings with questions that matter to communities.',
    ],
    [
      'Workflow Development',
      'Building thoughtful tools for the next scientific question.',
      'Reusable, documented workflows support collaboration and reproducible scientific work.',
    ],
  ],
  pipelines: [
    ['Daytona', 'Nextflow pipeline for SARS-CoV-2 whole-genome sequencing analysis.'],
    [
      'Sanibel',
      'Bacterial WGS pipeline for quality control, species identification, and AMR detection.',
    ],
    ['flisochar', 'Florida Bacterial Isolate Characterization for taxonomic and AMR profiling.'],
    [
      'Calusa',
      'Interactive tool for visualizing pathogen transmission networks from genomic data.',
    ],
    ['Daytona_dengue', 'Nextflow pipeline for Dengue virus NGS data analysis.'],
    [
      'SeqSender-BPHL',
      'Automates submission of sequence data and metadata to NCBI and other repositories.',
    ],
  ].map(([name, description]) => ({
    name,
    description,
    url: `https://github.com/BPHL-Molecular/${name}`,
  })),
}

export const trainingContent = {
  kicker: ['03 / Training', 'Building skills together'],
  title: ['Recent training.', 'Shared knowledge.'],
  description: 'Recent office-hours materials from the StaPH-B southeast-region training library.',
}

export const heroTags = [
  { label: 'Genomic Surveillance', to: '/#research-genomic-surveillance' },
  { label: 'Sequence Data Analysis', to: '/#research-sequence-analysis' },
  { label: 'Bioinformatics Pipelines', to: '/#bioinformatics-pipelines' },
  { label: 'Training & Support', to: '/#training' },
]
