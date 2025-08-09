<script>
    import * as Table from '$lib/components/ui/table/index.js';
	import * as Pagination from '$lib/components/ui/pagination';
		import {
		Render,
		Subscribe,
		createRender,
		createTable
	} from "svelte-headless-table";
	import {
		addHiddenColumns,
		addPagination,
		addSelectedRows,
		addSortBy,
		addTableFilter
	} from "svelte-headless-table/plugins";
	import { readable } from "svelte/store";

    
	
	const placeholderList = [
		{
			country: 'indonesia',
			country_flag: 'id',
			browser: 'Chrome',
			os: 'Mobile/Android'
		},
		{
			country: 'philiphines',
			country_flag: 'ph',
			browser: 'Safari',
			os: 'Mobile/iOS'
		},
		{
			country: 'united states',
			country_flag: 'us',
			browser: 'Chrome',
			os: 'Desktop/Windows'
		},
		{
			country: 'united kingdom',
			country_flag: 'gb',
			browser: 'Firefox',
			os: 'Desktop/Windows'
		},
		{
			country: 'australia',
			country_flag: 'au',
			browser: 'Chrome',
			os: 'Desktop/Windows'
		},
		{
			country: 'canada',
			country_flag: 'ca',
			browser: 'Chrome',
			os: 'Desktop/Windows'
		},
		{
			country: 'germany',
			country_flag: 'de',
			browser: 'Chrome',
			os: 'Desktop/Windows'
		},
		{
			country: 'france',
			country_flag: 'fr',
			browser: 'Chrome',
			os: 'Desktop/Windows'
		},
		{
			country: 'japan',
			country_flag: 'jp',
			browser: 'Chrome',
			os: 'Desktop/Windows'
		},
		{
			country: 'south korea',
			country_flag: 'kr',
			browser: 'Chrome',
			os: 'Desktop/Windows'
		},
		


	];

	const table = createTable(readable(placeholderList));
	const columns = table.createColumns([
		table.column({ accessor: "country", header: "Country" }),
		table.column({ accessor: "browser", header: "Browser" }),
		table.column({ accessor: "os", header: "OS" }),
	]);

	const { headerRows, pageRows, tableAttrs, tableBodyAttrs } =
    table.createViewModel(columns);

</script>

<div
              class="align-center flex w-full min-w-full h-full items-center justify-between py-2 transition-all md:py-2 rounded-md border "
            >
              <Table.Root class="" {...$tableAttrs}>
               
				<Table.Header>
					{#each $headerRows as headerRow}
					  <Subscribe rowAttrs={headerRow.attrs()}>
						<Table.Row>
						  {#each headerRow.cells as cell (cell.id)}
							<Subscribe attrs={cell.attrs()}  props={cell.props()}>
							  {#snippet children({ attrs })}
																<Table.Head {...attrs}>
									<Render of={cell.render()} />
								  </Table.Head>
																							{/snippet}
														</Subscribe>
						  {/each}
						</Table.Row>
					  </Subscribe>
					{/each}
				  </Table.Header>
				  <Table.Body {...$tableBodyAttrs}>
					{#each $pageRows as row (row.id)}
					  <Subscribe rowAttrs={row.attrs()} >
						{#snippet children({ rowAttrs })}
										<Table.Row {...rowAttrs}>
							  {#each row.cells as cell (cell.id)}
								<Subscribe attrs={cell.attrs()} >
								  {#snippet children({ attrs })}
																<Table.Cell {...attrs}>
										<Render of={cell.render()} />
									  </Table.Cell>
																								{/snippet}
														</Subscribe>
							  {/each}
							</Table.Row>
						  									{/snippet}
								</Subscribe>
					{/each}
				  </Table.Body>
              </Table.Root>
            </div>

<!-- render table -->
<!-- https://shadcn-svelte.com/docs/components/data-table -->