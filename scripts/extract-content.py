import sys,re,json,pathlib
sys.path.insert(0,'.tools/python')
from pypdf import PdfReader
labels=['Цель:', 'Тайминг:', 'Теория: объяснение для преподавателя', 'Словарь урока', 'Раздача с разбором','Практическое упражнение','Ответы и критерии','Домашнее задание','Заметки старшего крупье','Пять контрольных вопросов']
for p in sorted(pathlib.Path('.').glob('0[123]*.pdf')):
 course=p.name.split('_')[1].lower()
 pages=[]
 for page in PdfReader(p).pages:
  lines=page.extract_text().splitlines()
  pages.append('\n'.join(l.strip() for l in lines if not re.match(r'СТЭК ACADEMY\s*•',l) and not re.match(r'^\d+$',l.strip())))
 raw='\n'.join(pages)
 starts=list(re.finditer(r'УРОК\s+(\d+)\s*/\s*',raw))
 lessons=[]
 for i,m in enumerate(starts):
  body=raw[m.end():starts[i+1].start() if i+1<len(starts) else raw.index('Словарь курса',m.end())]
  title=' '.join(body[:body.index('Цель:')].split())
  fields={}
  for j,label in enumerate(labels):
   pos=body.find(label)
   if pos<0: raise Exception((course,title,label))
   end=body.find(labels[j+1],pos+len(label)) if j+1<len(labels) else len(body)
   fields[['goal','timing','theory','terms','hand','practice','answer','homework','notes','questions'][j]]=' '.join(body[pos+len(label):end].split())
  lessons.append(dict(id=f'{course}-{int(m.group(1)):02}',number=int(m.group(1)),title=title,duration=60,source=p.name,**fields))
 pathlib.Path('src/content/courses',course+'.json').write_text(json.dumps(lessons,ensure_ascii=False,indent=2),encoding='utf-8')
 print(course, len(lessons))
 for l in lessons: print(l['number'],l['title'],'\n',l['theory'],'\nПРИМЕР:',l['hand'])
